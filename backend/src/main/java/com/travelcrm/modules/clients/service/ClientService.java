package com.travelcrm.modules.clients.service;

import com.travelcrm.config.UserPrincipal;
import com.travelcrm.modules.auth.Role;
import com.travelcrm.modules.auth.UserEntity;
import com.travelcrm.modules.auth.UserRepository;
import com.travelcrm.modules.clients.ClientEntity;
import com.travelcrm.modules.clients.ClientRepository;
import com.travelcrm.modules.clients.dto.ClientRequest;
import com.travelcrm.modules.clients.dto.ClientResponse;
import com.travelcrm.shared.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ClientService {
    private final ClientRepository clientRepository;
    private final UserRepository userRepository;

    public Page<ClientResponse> findAll(String search, String status, UUID managerId, Pageable pageable, UserPrincipal currentUser) {
        if (currentUser.getRole() == Role.MANAGER) {
            managerId = currentUser.getId();
        }
        return clientRepository.findWithFilters(search, status, managerId, pageable).map(this::toResponse);
    }

    public ClientResponse findById(UUID id, UserPrincipal currentUser) {
        ClientEntity client = clientRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Клиент не найден"));
        if (currentUser.getRole() == Role.MANAGER &&
            (client.getAssignedManager() == null || !client.getAssignedManager().getId().equals(currentUser.getId()))) {
            throw new AccessDeniedException("Нет доступа");
        }
        return toResponse(client);
    }

    @Transactional
    public ClientResponse create(ClientRequest request, UserPrincipal currentUser) {
        ClientEntity client = new ClientEntity();
        applyRequest(client, request, currentUser);
        return toResponse(clientRepository.save(client));
    }

    @Transactional
    public ClientResponse update(UUID id, ClientRequest request, UserPrincipal currentUser) {
        ClientEntity client = clientRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Клиент не найден"));
        if (currentUser.getRole() == Role.MANAGER &&
            (client.getAssignedManager() == null || !client.getAssignedManager().getId().equals(currentUser.getId()))) {
            throw new AccessDeniedException("Нет доступа");
        }
        applyRequest(client, request, currentUser);
        return toResponse(clientRepository.save(client));
    }

    @Transactional
    public void delete(UUID id) {
        if (!clientRepository.existsById(id)) {
            throw new NotFoundException("Клиент не найден");
        }
        clientRepository.deleteById(id);
    }

    private void applyRequest(ClientEntity client, ClientRequest req, UserPrincipal currentUser) {
        client.setFirstName(req.getFirstName());
        client.setLastName(req.getLastName());
        client.setEmail(req.getEmail());
        client.setPhone(req.getPhone());
        client.setPassportNumber(req.getPassportNumber());
        client.setPassportExpiry(req.getPassportExpiry());
        client.setDateOfBirth(req.getDateOfBirth());
        client.setStatus(req.getStatus() != null ? req.getStatus() : "NEW");
        client.setTags(req.getTags());
        client.setPreferences(req.getPreferences());
        client.setSource(req.getSource());
        client.setNotes(req.getNotes());
        UUID managerId = req.getAssignedManagerId();
        if (currentUser.getRole() == Role.MANAGER) {
            managerId = currentUser.getId();
        }
        if (managerId != null) {
            UserEntity mgr = userRepository.findById(managerId).orElse(null);
            client.setAssignedManager(mgr);
        }
    }

    private ClientResponse toResponse(ClientEntity c) {
        ClientResponse r = new ClientResponse();
        r.setId(c.getId());
        r.setFirstName(c.getFirstName());
        r.setLastName(c.getLastName());
        r.setFullName(c.getFirstName() + " " + c.getLastName());
        r.setEmail(c.getEmail());
        r.setPhone(c.getPhone());
        r.setPassportNumber(c.getPassportNumber());
        r.setPassportExpiry(c.getPassportExpiry());
        r.setDateOfBirth(c.getDateOfBirth());
        r.setStatus(c.getStatus());
        r.setTags(c.getTags());
        r.setPreferences(c.getPreferences());
        r.setSource(c.getSource());
        r.setNotes(c.getNotes());
        r.setTotalBookings(c.getTotalBookings());
        r.setTotalRevenue(c.getTotalRevenue());
        r.setCreatedAt(c.getCreatedAt());
        r.setUpdatedAt(c.getUpdatedAt());
        if (c.getAssignedManager() != null) {
            r.setAssignedManagerId(c.getAssignedManager().getId());
            r.setAssignedManagerName(c.getAssignedManager().getFullName());
        }
        return r;
    }
}
