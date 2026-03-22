package com.travelcrm.modules.leads;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface LeadRepository extends JpaRepository<LeadEntity, UUID> {
    @Query("SELECT l FROM LeadEntity l WHERE (:stage IS NULL OR l.stage = :stage) AND (:managerId IS NULL OR l.assignedManager.id = :managerId)")
    Page<LeadEntity> findWithFilters(
        @Param("stage") String stage,
        @Param("managerId") UUID managerId,
        Pageable pageable
    );
}
