package com.travelcrm.modules.bookings.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class BookingMonthlySummaryResponse {
    private int month;
    private String label;
    private long count;
    private BigDecimal totalAmount;
}
