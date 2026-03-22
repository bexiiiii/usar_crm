package com.travelcrm.modules.clients;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface ClientRepository extends JpaRepository<ClientEntity, UUID> {
    @Query("""
        SELECT c FROM ClientEntity c
        WHERE (:search IS NULL OR LOWER(c.firstName) LIKE LOWER(CONCAT('%', :search, '%'))
            OR LOWER(c.lastName) LIKE LOWER(CONCAT('%', :search, '%'))
            OR LOWER(c.phone) LIKE LOWER(CONCAT('%', :search, '%'))
            OR LOWER(c.email) LIKE LOWER(CONCAT('%', :search, '%')))
        AND (:status IS NULL OR c.status = :status)
        AND (:managerId IS NULL OR c.assignedManager.id = :managerId)
        """)
    Page<ClientEntity> findWithFilters(
        @Param("search") String search,
        @Param("status") String status,
        @Param("managerId") UUID managerId,
        Pageable pageable
    );
}
