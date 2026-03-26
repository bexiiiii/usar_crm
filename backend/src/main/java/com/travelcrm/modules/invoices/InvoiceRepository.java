package com.travelcrm.modules.invoices;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.util.UUID;

public interface InvoiceRepository extends JpaRepository<InvoiceEntity, UUID>, JpaSpecificationExecutor<InvoiceEntity> {

    long countByStatus(String status);

    @Query("SELECT COALESCE(SUM(i.totalAmount), 0) FROM InvoiceEntity i WHERE i.status = 'PAID' AND MONTH(i.paidAt) = MONTH(CURRENT_TIMESTAMP) AND YEAR(i.paidAt) = YEAR(CURRENT_TIMESTAMP)")
    BigDecimal sumPaidCurrentMonth();
}
