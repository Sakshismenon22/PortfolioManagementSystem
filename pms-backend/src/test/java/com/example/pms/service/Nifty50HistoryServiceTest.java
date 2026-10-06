package com.example.pms.service;


import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertThrows;

@ExtendWith(MockitoExtension.class)
public class Nifty50HistoryServiceTest {

    @Test
    @DisplayName("TC-NIFTY50-001 | Reject the retrieval of history when from is null")
    void getHistory_shouldThrowException_whenFromIsNull() throws Exception{

        Nifty50HistoryService service = new Nifty50HistoryService();

        assertThrows(IllegalArgumentException.class, () -> service.getHistory(null, LocalDate.of(2026, 10, 1)));
    }


    @Test
    @DisplayName("TC-Nifty50-002 | Reject the retrieval of history when to is null")
    void getHistory_shouldThrowException_whenToIsNull() throws Exception{

        Nifty50HistoryService service = new Nifty50HistoryService();

        assertThrows(IllegalArgumentException.class, () -> service.getHistory(LocalDate.of(2026,10,1), null));
    }

    @Test
    @DisplayName("TC-Nifty50-003 | Reject the retrieval of history when from is after to date")
    void getHistory_shouldThrowException_whenFromIsAfterTo() throws Exception{

        Nifty50HistoryService service = new Nifty50HistoryService();

        assertThrows(IllegalArgumentException.class, () -> service.getHistory(LocalDate.of(2026,10,2), LocalDate.of(2026,10,1)));
    }
}
