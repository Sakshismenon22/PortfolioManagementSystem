package com.example.pms.service;

import com.example.pms.model.DriftWatchList;
import com.example.pms.model.Portfolio;
import com.example.pms.model.enums.ReBalancingFrequency;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class DriftScheduleTest {

    private final LocalDate baseDate =
            LocalDate.of(2026, 10, 1);


    @Test
    @DisplayName("TC-SCHEDULE-001 | Null frequency defaults to monthly")
    void nextDate_shouldUseMonthly_whenFrequencyNull() {

        assertEquals(
                LocalDate.of(2026, 11, 1),
                DriftSchedule.nextDate(
                        baseDate,
                        null
                )
        );
    }


    @Test
    @DisplayName("TC-SCHEDULE-002 | Daily")
    void nextDate_shouldAddOneDay() {

        assertEquals(
                LocalDate.of(2026, 10, 2),
                DriftSchedule.nextDate(
                        baseDate,
                        ReBalancingFrequency.DAILY
                )
        );
    }


    @Test
    @DisplayName("TC-SCHEDULE-003 | Weekly")
    void nextDate_shouldAddOneWeek() {

        assertEquals(
                LocalDate.of(2026, 10, 8),
                DriftSchedule.nextDate(
                        baseDate,
                        ReBalancingFrequency.WEEKLY
                )
        );
    }


    @Test
    @DisplayName("TC-SCHEDULE-004 | Monthly")
    void nextDate_shouldAddOneMonth() {

        assertEquals(
                LocalDate.of(2026, 11, 1),
                DriftSchedule.nextDate(
                        baseDate,
                        ReBalancingFrequency.MONTHLY
                )
        );
    }


    @Test
    @DisplayName("TC-SCHEDULE-005 | Quarterly")
    void nextDate_shouldAddThreeMonths() {

        assertEquals(
                LocalDate.of(2027, 1, 1),
                DriftSchedule.nextDate(
                        baseDate,
                        ReBalancingFrequency.QUARTERLY
                )
        );
    }


    @Test
    @DisplayName("TC-SCHEDULE-006 | Semi annual")
    void nextDate_shouldAddSixMonths() {

        assertEquals(
                LocalDate.of(2027, 4, 1),
                DriftSchedule.nextDate(
                        baseDate,
                        ReBalancingFrequency.SEMI_ANNUAL
                )
        );
    }


    @Test
    @DisplayName("TC-SCHEDULE-007 | Yearly")
    void nextDate_shouldAddOneYear() {

        assertEquals(
                LocalDate.of(2027, 10, 1),
                DriftSchedule.nextDate(
                        baseDate,
                        ReBalancingFrequency.YEARLY
                )
        );
    }


    @Test
    @DisplayName("TC-SCHEDULE-008 | Create new watch list")
    void newWatchList_shouldCreateWatchList() {

        Portfolio portfolio =
                new Portfolio();

        portfolio.setId(100L);

        portfolio.setReBalancingFrequency(
                ReBalancingFrequency.MONTHLY
        );

        DriftWatchList result =
                DriftSchedule.newWatchList(
                        portfolio,
                        baseDate
                );

        assertNotNull(result);

        assertEquals(
                100L,
                result.getPortfolioId()
        );

        assertEquals(
                LocalDate.of(2026, 11, 1),
                result.getNextDriftCalculationDate()
        );

        assertEquals(
                ReBalancingFrequency.MONTHLY,
                result.getReBalancingFrequency()
        );
    }
}