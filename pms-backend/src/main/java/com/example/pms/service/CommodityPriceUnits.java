package com.example.pms.service;

import com.example.pms.model.CommoditySpotData;

import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Normalizes gold market quotes to one-gram units for portfolio quantities. */
final class CommodityPriceUnits {
    private static final Pattern GRAMS = Pattern.compile("(\\d+(?:\\.\\d+)?)\\s*(?:G|GM|GRAMS?)\\b");

    private CommodityPriceUnits() { }

    static double perPortfolioUnit(CommoditySpotData spot, String symbol) {
        if (spot == null || spot.getSpotPrice() == null) return 0.0;
        double price = spot.getSpotPrice().doubleValue();
        if (price <= 0 || !"GOLD".equalsIgnoreCase(symbol)) return price;

        String quotation = spot.getQuotation() == null ? "" : spot.getQuotation().toUpperCase(Locale.ROOT);
        double gramsPerQuote = quoteGramCount(quotation);
        // The Gold security master quote is in 10-gram lots when unit metadata is omitted.
        return price / gramsPerQuote;
    }

    private static double quoteGramCount(String quotation) {
        if (quotation.contains("KG") || quotation.contains("KILOGRAM")) return 1000.0;
        Matcher matcher = GRAMS.matcher(quotation);
        if (matcher.find()) {
            try {
                return Math.max(1.0, Double.parseDouble(matcher.group(1)));
            } catch (NumberFormatException ignored) {
                // Fall through to the default gold quote unit.
            }
        }
        if (quotation.contains("GRAM") || quotation.matches(".*\\bG\\b.*")) return 1.0;
        return 10.0;
    }
}
