package com.example.pms.service;

import com.example.pms.dto.response.BenchmarkHistoryPointDTO;
import javafx.util.converter.LocalDateStringConverter;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import tools.jackson.databind.JsonNode;

import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;
import java.net.CookieManager;
import java.net.CookiePolicy;
import java.net.http.HttpClient;
import java.security.SecureRandom;
import java.security.cert.X509Certificate;
import java.time.Duration;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
public class Nifty50HistoryService {

    private static final DateTimeFormatter NSE_DATE = new DateTimeFormatterBuilder()
            .parseCaseInsensitive()
            .appendPattern("dd-MMM-yyyy")
            .toFormatter(Locale.ENGLISH);
    private static final DateTimeFormatter QUERY_DATE = DateTimeFormatter.ofPattern("dd-MM-yyyy");
    private final HttpClient client = HttpClient.newBuilder()
            .connectTimeout(Duration.ofMillis(3000))
            .followRedirects(HttpClient.Redirect.NORMAL)
            .cookieHandler(new CookieManager(null, CookiePolicy.ACCEPT_ALL))
            .sslContext(trustAllSslContext()).build();
    private final JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(client);
    private final RestClient restClient = RestClient.builder()
            .requestFactory(factory)
            .defaultHeader(HttpHeaders.USER_AGENT,
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                            + "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36")
            .defaultHeader(HttpHeaders.ACCEPT,
                    "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
            .defaultHeader(HttpHeaders.ACCEPT_LANGUAGE, "en-US,en;q=0.9")
            .build();

    public Nifty50HistoryService() throws Exception {
    }

    public List<BenchmarkHistoryPointDTO> getHistory(LocalDate from, LocalDate to) {
        if (from == null || to == null || from.isAfter(to)) {
            throw new IllegalArgumentException("A valid benchmark date range is required.");
        }

        RestClient client = restClient;
//        LocalDate from2 = LocalDate.of(2025, 9, 30);
        LocalDate from2 = to.minusYears(1);
        String cookies = "";
        try {
            ResponseEntity<Void> landingPage = client.get()
                    .uri("https://www.nseindia.com/")
                    .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0 Safari/537.36")
                    .header("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8")
                    .header("Accept-Language", "en-US,en;q=0.9")
                    .header("Connection", "keep-alive")
                    .retrieve()
                    .toBodilessEntity();
            cookies = landingPage.getHeaders().getOrEmpty(HttpHeaders.SET_COOKIE).stream()
                    .map(cookie -> cookie.split(";", 2)[0])
                    .collect(Collectors.joining("; "));
        } catch (RuntimeException ignored) {
            // The endpoint request below remains the source of the actual error if NSE denies anonymous access.
        }

        var historyRequest = client.get()
                .uri(uriBuilder -> uriBuilder
                        .scheme("https")
                        .host("www.nseindia.com")
                        .path("/api/historicalOR/indicesHistory")
                        .queryParam("indexType", "NIFTY 50")
                        .queryParam("from", from2.format(QUERY_DATE))
                        .queryParam("to", to.format(QUERY_DATE))
                        .queryParam("csv", "true")
                        .build())
                .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0 Safari/537.36")
                .header("Accept", "application/json, text/plain, */*")
                .header("Accept-Language", "en-US,en;q=0.9")
                .header("Referer", "https://www.nseindia.com/")
                .header("Origin", "https://www.nseindia.com")
                .header("X-Requested-With", "XMLHttpRequest");
        if (!cookies.isBlank()) {
            historyRequest.header(HttpHeaders.COOKIE, cookies);
        }
        JsonNode response = historyRequest.retrieve().body(JsonNode.class);

        JsonNode rows = response == null ? null : response.path("data");
        if (rows == null || !rows.isArray()) {
            throw new IllegalStateException("NSE did not return NIFTY 50 history in the expected format.");
        }

        List<BenchmarkHistoryPointDTO> points = new ArrayList<>();
        for (JsonNode row : rows) {
            String rawDate = row.path("EOD_TIMESTAMP").asText("");
            JsonNode closeNode = row.path("EOD_CLOSE_INDEX_VAL");
            if (rawDate.isBlank() || closeNode.isMissingNode() || !closeNode.isNumber()) {
                continue;
            }
            LocalDate date = LocalDate.parse(rawDate, NSE_DATE);
            double close = closeNode.asDouble();
            if (!date.isBefore(from) && !date.isAfter(to) && close > 0) {
                points.add(new BenchmarkHistoryPointDTO(date, close));
            }
        }
        points.sort(Comparator.comparing(BenchmarkHistoryPointDTO::getDate));
        return points;
    }

    private SSLContext trustAllSslContext() throws Exception {
        TrustManager[] trustAll = new TrustManager[]{
                new X509TrustManager() {
                    @Override public void checkClientTrusted(X509Certificate[] c, String a) { }
                    @Override public void checkServerTrusted(X509Certificate[] c, String a) { }
                    @Override public X509Certificate[] getAcceptedIssuers() { return new X509Certificate[0]; }
                }
        };
        SSLContext ctx = SSLContext.getInstance("TLS");
        ctx.init(null, trustAll, new SecureRandom());
        return ctx;
    }
}
