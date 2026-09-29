package com.example.pms.service;

import com.example.pms.model.DriftWatchList;
import com.example.pms.model.Portfolio;
import com.example.pms.model.enums.ReBalancingFrequency;

import java.time.LocalDate;

final class DriftSchedule {

    private DriftSchedule() {}

    static LocalDate nextDate(LocalDate from, ReBalancingFrequency frequency) {
        if (frequency == null) {
            return from.plusMonths(1);
        }

        return switch (frequency) {
            case DAILY -> from.plusDays(1);
            case WEEKLY -> from.plusWeeks(1);
            case MONTHLY -> from.plusMonths(1);
            case QUARTERLY -> from.plusMonths(3);
            case SEMI_ANNUAL -> from.plusMonths(6);
            case YEARLY -> from.plusYears(1);
        };
    }

    static DriftWatchList newWatchList(Portfolio portfolio, LocalDate createdAt) {
        return new DriftWatchList(
                null,
                portfolio.getId(),
                nextDate(createdAt, portfolio.getReBalancingFrequency()),
                null,
                portfolio.getReBalancingFrequency()
        );
    }
}
