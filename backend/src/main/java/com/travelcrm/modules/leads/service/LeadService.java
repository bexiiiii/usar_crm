package com.travelcrm.modules.leads.service;

import com.travelcrm.config.UserPrincipal;
import com.travelcrm.modules.auth.Role;
import com.travelcrm.modules.auth.UserRepository;
import com.travelcrm.modules.clients.ClientRepository;
import com.travelcrm.modules.leads.LeadEntity;
import com.travelcrm.modules.leads.LeadRepository;
import com.travelcrm.modules.leads.dto.LeadRequest;
import com.travelcrm.modules.leads.dto.LeadResponse;
import com.travelcrm.shared.exception.NotFoundException;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LeadService {
    private final LeadRepository leadRepository;
    private final ClientRepository clientRepository;
    private final UserRepository userRepository;

    public Page<LeadResponse> findAll(String stage, UUID managerId, Pageable pageable, UserPrincipal currentUser) {
        if (currentUser.getRole() == Role.MANAGER) {
            managerId = currentUser.getId();
        }
        final UUID finalManagerId = managerId;
        Specification<LeadEntity> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (stage != null) predicates.add(cb.equal(root.get("stage"), stage));
            if (finalManagerId != null) predicates.add(cb.equal(root.get("assignedManager").get("id"), finalManagerId));
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        return leadRepository.findAll(spec, pageable).map(this::toResponse);
    }

    public LeadResponse findById(UUID id) {
        return toResponse(leadRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Лид не найден")));
    }

    @Transactional
    public LeadResponse create(LeadRequest req, UserPrincipal currentUser) {
        LeadEntity lead = new LeadEntity();
        applyRequest(lead, req, currentUser);
        return toResponse(leadRepository.save(lead));
    }

    @Transactional
    public LeadResponse update(UUID id, LeadRequest req, UserPrincipal currentUser) {
        LeadEntity lead = leadRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Лид не найден"));
        applyRequest(lead, req, currentUser);
        return toResponse(leadRepository.save(lead));
    }

    @Transactional
    public LeadResponse updateStage(UUID id, String stage) {
        LeadEntity lead = leadRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Лид не найден"));
        lead.setStage(stage);
        return toResponse(leadRepository.save(lead));
    }

    @Transactional
    public void delete(UUID id) {
        if (!leadRepository.existsById(id)) {
            throw new NotFoundException("Лид не найден");
        }
        leadRepository.deleteById(id);
    }

    private void applyRequest(LeadEntity lead, LeadRequest req, UserPrincipal currentUser) {
        if (req.getClientId() != null) {
            clientRepository.findById(req.getClientId()).ifPresent(lead::setClient);
        }
        lead.setTitle(req.getTitle());
        lead.setStage(req.getStage() != null ? req.getStage() : "NEW");
        lead.setSource(req.getSource());
        lead.setDestination(req.getDestination());
        lead.setTravelDatesFrom(req.getTravelDatesFrom());
        lead.setTravelDatesTo(req.getTravelDatesTo());
        lead.setPaxAdults(req.getPaxAdults());
        lead.setPaxChildren(req.getPaxChildren());
        lead.setBudgetMin(req.getBudgetMin());
        lead.setBudgetMax(req.getBudgetMax());
        lead.setLostReason(req.getLostReason());
        lead.setProbability(req.getProbability());
        lead.setExpectedCloseDate(req.getExpectedCloseDate());
        lead.setNotes(req.getNotes());
        UUID managerId = req.getAssignedManagerId();
        if (currentUser.getRole() == Role.MANAGER) {
            managerId = currentUser.getId();
        }
        if (managerId != null) {
            userRepository.findById(managerId).ifPresent(lead::setAssignedManager);
        }
    }

    private LeadResponse toResponse(LeadEntity l) {
        LeadResponse r = new LeadResponse();
        r.setId(l.getId());
        r.setTitle(l.getTitle());
        r.setStage(l.getStage());
        r.setSource(l.getSource());
        r.setDestination(l.getDestination());
        r.setTravelDatesFrom(l.getTravelDatesFrom());
        r.setTravelDatesTo(l.getTravelDatesTo());
        r.setPaxAdults(l.getPaxAdults());
        r.setPaxChildren(l.getPaxChildren());
        r.setBudgetMin(l.getBudgetMin());
        r.setBudgetMax(l.getBudgetMax());
        r.setLostReason(l.getLostReason());
        r.setProbability(l.getProbability());
        r.setExpectedCloseDate(l.getExpectedCloseDate());
        r.setNotes(l.getNotes());
        r.setCreatedAt(l.getCreatedAt());
        r.setUpdatedAt(l.getUpdatedAt());
        if (l.getClient() != null) {
            r.setClientId(l.getClient().getId());
            r.setClientName(l.getClient().getFirstName() + " " + l.getClient().getLastName());
        }
        if (l.getAssignedManager() != null) {
            r.setAssignedManagerId(l.getAssignedManager().getId());
            r.setAssignedManagerName(l.getAssignedManager().getFullName());
        }
        return r;
    }
}
