package com.travelcrm.modules.tasks;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface TaskRepository extends JpaRepository<TaskEntity, UUID> {
    @Query("SELECT t FROM TaskEntity t WHERE (:assignedTo IS NULL OR t.assignedTo.id = :assignedTo) AND (:status IS NULL OR t.status = :status) AND (:priority IS NULL OR t.priority = :priority)")
    Page<TaskEntity> findWithFilters(
        @Param("assignedTo") UUID assignedTo,
        @Param("status") String status,
        @Param("priority") String priority,
        Pageable pageable
    );

    @Query("SELECT t FROM TaskEntity t WHERE t.assignedTo.id = :userId AND t.status = 'TODO' AND t.dueDate <= :deadline")
    List<TaskEntity> findDueSoon(@Param("userId") UUID userId, @Param("deadline") Instant deadline);
}
