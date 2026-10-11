package com.example.pms.service;

import com.example.pms.model.Bond;

/** Resolves the per-bond quote used by portfolio trades and valuation. */
public final class BondPriceResolver {
    private BondPriceResolver() { }

    /**
     * Uses the market clean price when available. Seeded bonds may not yet have
     * a quote, in which case face value is the only available par-price fallback.
     */
    public static double unitPrice(Bond bond) {
        if (bond == null) {
            throw new IllegalStateException("Security Master returned no bond data.");
        }
        Double cleanPrice = bond.getCleanPrice();
        if (cleanPrice != null && Double.isFinite(cleanPrice) && cleanPrice > 0) {
            return cleanPrice;
        }
        Double faceValue = bond.getFaceValue();
        if (faceValue != null && Double.isFinite(faceValue) && faceValue > 0) {
            return faceValue;
        }
        throw new IllegalStateException("Security Master returned no valid bond price or face value.");
    }
}
