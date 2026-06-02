package com.travelcrm.modules.settings.dto;

import lombok.Data;

import java.util.Map;

@Data
public class SettingsRequest {
    private Map<String, Object> company;
    private Map<String, Object> notifications;
    private Map<String, Object> security;
    private Map<String, Object> documents;
    private Map<String, Object> appearance;
}
