package com.travelcrm.modules.invoices.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
public class InvoiceStatsResponse {
    private long totalCount;
    private long unpaidCount;
    private long overdueCount;
    private BigDecimal paidMonthAmount;
}
