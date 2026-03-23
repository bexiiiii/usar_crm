package com.travelcrm.modules.tasks;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface TaskRepository extends JpaRepository<TaskEntity, UUID>, JpaSpecificationExecutor<TaskEntity> {

    @Query("SELECT t FROM TaskEntity t WHERE t.assignedTo.id = :userId AND t.status = 'TODO' AND t.dueDate <= :deadline")
    List<TaskEntity> findDueSoon(@Param("userId") UUID userId, @Param("deadline") Instant deadline);
}
