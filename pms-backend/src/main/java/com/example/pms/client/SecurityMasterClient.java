package com.example.pms.client;

import com.example.pms.dto.response.SecuritiesInfoDTO;
import com.example.pms.dto.response.SecurityPriceDTO;
import com.example.pms.response.Response;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class SecurityMasterClient {

    private final RestClient securityMasterRestClient;


    public Optional<SecurityPriceDTO> findBySecurityId(Long id) {
        try {
            Response<SecurityPriceDTO> envelope = securityMasterRestClient.get()
                    .uri("/api/security/get-security-price/{id}", id)
                    .retrieve()
                    .body(new ParameterizedTypeReference<Response<SecurityPriceDTO>>() {});
            if (envelope == null) {
                log.warn("Null envelope for securityId={}", id);
                return Optional.empty();
            }
            if (!envelope.getSuccess()) {
                log.warn("Security Master returned success=false for id={}: {}",
                        id, envelope.getMessage());
                return Optional.empty();
            }

            log.debug("Price payload for id={}: {}", id, envelope.getData());
            return Optional.ofNullable(envelope.getData());

        } catch (Exception e) {
            log.warn("Security lookup failed for Security Id {}: {}", id, e.getMessage());
            return Optional.empty();
        }
    }

    @Cacheable(value="securities" ,key = "'getAllSecurities'")
    public Optional<SecuritiesInfoDTO> getAllSecurityInfo(){
        try {
            Response<SecuritiesInfoDTO> envelope = securityMasterRestClient.get()
                    .uri("/api/security/get-all-security-info")
                    .retrieve()
                    .body(new ParameterizedTypeReference<Response<SecuritiesInfoDTO>>() {});
            if (envelope == null) {
                log.warn("Securities info request failed");
                return Optional.empty();
            }
            if (!envelope.getSuccess()) {
                log.warn("Security Master returned success=false message: {}", envelope.getMessage());
                return Optional.empty();
            }

            log.debug("Security Info message: {}",envelope.getData());
            return Optional.ofNullable(envelope.getData());

        } catch (Exception e) {
            log.warn("Security lookup failed for all Securities ",e.getMessage());
            return Optional.empty();
        }
    }


}
