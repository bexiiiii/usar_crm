package com.travelcrm.modules.settings.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.travelcrm.modules.settings.AppSettingEntity;
import com.travelcrm.modules.settings.AppSettingRepository;
import com.travelcrm.modules.settings.dto.SettingsRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SettingsService {
    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {};

    private final AppSettingRepository appSettingRepository;
    private final ObjectMapper objectMapper;

    public Map<String, Object> getAll() {
        Map<String, Object> response = defaultSettings();
        List<AppSettingEntity> stored = appSettingRepository.findAll();
        for (AppSettingEntity entry : stored) {
            response.put(entry.getSection(), parse(entry.getValueJson()));
        }
        return response;
    }

    @Transactional
    public Map<String, Object> update(SettingsRequest request) {
        store("company", request.getCompany());
        store("notifications", request.getNotifications());
        store("security", request.getSecurity());
        store("documents", request.getDocuments());
        store("appearance", request.getAppearance());
        return getAll();
    }

    private void store(String section, Map<String, Object> payload) {
        if (payload == null) {
            return;
        }
        AppSettingEntity entity = appSettingRepository.findById(section).orElseGet(AppSettingEntity::new);
        entity.setSection(section);
        entity.setValueJson(write(payload));
        appSettingRepository.save(entity);
    }

    private Map<String, Object> parse(String json) {
        try {
            return objectMapper.readValue(json, MAP_TYPE);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Не удалось прочитать настройки", e);
        }
    }

    private String write(Map<String, Object> value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Не удалось сохранить настройки", e);
        }
    }

    private Map<String, Object> defaultSettings() {
        Map<String, Object> settings = new LinkedHashMap<>();
        settings.put("company", new LinkedHashMap<>(Map.ofEntries(
            Map.entry("name", "Usar Travel Agency"),
            Map.entry("legalName", "ТОО «Usar Travel»"),
            Map.entry("bin", ""),
            Map.entry("phone", "+7 (777) 000-00-00"),
            Map.entry("email", "info@usartravel.kz"),
            Map.entry("address", "г. Алматы, ул. Абая, 1"),
            Map.entry("website", "https://usartravel.kz"),
            Map.entry("currency", "KZT"),
            Map.entry("timezone", "Asia/Almaty"),
            Map.entry("language", "ru"),
            Map.entry("workStart", "09:00"),
            Map.entry("workEnd", "18:00")
        )));
        settings.put("notifications", new LinkedHashMap<>(Map.ofEntries(
            Map.entry("emailNewBooking", true),
            Map.entry("emailPaymentDue", true),
            Map.entry("emailClientBirthday", true),
            Map.entry("emailLeadAssigned", true),
            Map.entry("smsNewBooking", false),
            Map.entry("smsPaymentReminder", true),
            Map.entry("telegramBotEnabled", false),
            Map.entry("overdueAlerts", true),
            Map.entry("departureDays", "3"),
            Map.entry("paymentDeadlineDays", "5"),
            Map.entry("passportExpireDays", "180")
        )));
        settings.put("security", new LinkedHashMap<>(Map.ofEntries(
            Map.entry("twoFactor", false),
            Map.entry("sessionTimeout", "480"),
            Map.entry("ipRestriction", false),
            Map.entry("allowedIPs", ""),
            Map.entry("passwordMinLength", "8"),
            Map.entry("requireSpecialChars", true)
        )));
        settings.put("documents", new LinkedHashMap<>(Map.ofEntries(
            Map.entry("companyLogo", ""),
            Map.entry("contractHeader", "Настоящий договор заключён между:"),
            Map.entry("contractFooter", ""),
            Map.entry("voucherHeader", ""),
            Map.entry("invoicePrefix", "INV"),
            Map.entry("invoiceStartNumber", "1001"),
            Map.entry("taxPercent", "12"),
            Map.entry("showTax", true)
        )));
        settings.put("appearance", new LinkedHashMap<>(Map.ofEntries(
            Map.entry("primaryColor", "#2B5BF0"),
            Map.entry("accentColor", "#22C55E"),
            Map.entry("companyName", "Usar Travel CRM"),
            Map.entry("sidebarDark", true),
            Map.entry("compactMode", false),
            Map.entry("showAvatars", true)
        )));
        return settings;
    }
}
