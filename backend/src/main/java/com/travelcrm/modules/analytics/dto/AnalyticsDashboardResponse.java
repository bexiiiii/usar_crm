package com.travelcrm.modules.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsDashboardResponse {
    private BigDecimal revenueCurrentMonth;
    private BigDecimal revenuePreviousMonth;
    private double revenueTrend;
    private long bookingsCurrentMonth;
    private long bookingsPreviousMonth;
    private double bookingsTrend;
    private long newLeadsCurrentMonth;
    private long newLeadsPreviousMonth;
    private double leadsTrend;
    private double conversionRate;
    private double conversionRatePrevious;
    private double conversionTrend;
}
