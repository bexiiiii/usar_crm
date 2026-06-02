package com.travelcrm.modules.auth;

import java.util.HashMap;
import java.util.Map;

public final class UserPermissions {
    private UserPermissions() {}

    public static final String EDIT_RECORD = "edit_record";
    public static final String DELETE_RECORD = "delete_record";
    public static final String VIEW_ALL_MANAGERS = "view_all_managers";
    public static final String MANAGE_USERS = "manage_users";
    public static final String VIEW_COST_PRICE = "view_cost_price";
    public static final String EXPORT_DATA = "export_data";
    public static final String CANCEL_BOOKING = "cancel_booking";
    public static final String VIEW_ANALYTICS = "view_analytics";
    public static final String VIEW_PAYMENTS = "view_payments";
    public static final String VIEW_REPORTS = "view_reports";
    public static final String MANAGE_SETTINGS = "manage_settings";
    public static final String MANAGE_NOTIFICATIONS = "manage_notifications";
    public static final String MANAGE_TASKS = "manage_tasks";
    public static final String MANAGE_DOCUMENTS = "manage_documents";
    public static final String MANAGE_INVOICES = "manage_invoices";
    public static final String ASSIGN_TASKS = "assign_tasks";
    public static final String MANAGE_BUSES = "manage_buses";
    public static final String MANAGE_ROUTES = "manage_routes";
    public static final String MANAGE_DRIVERS = "manage_drivers";
    public static final String VIEW_BUS_ANALYTICS = "view_bus_analytics";

    public static Map<String, Boolean> defaultsFor(Role role) {
        Map<String, Boolean> permissions = new HashMap<>();
        if (role == Role.SUPER_ADMIN) {
            permissions.put(EDIT_RECORD, true);
            permissions.put(DELETE_RECORD, true);
            permissions.put(VIEW_ALL_MANAGERS, true);
            permissions.put(MANAGE_USERS, true);
            permissions.put(VIEW_COST_PRICE, true);
            permissions.put(EXPORT_DATA, true);
            permissions.put(CANCEL_BOOKING, true);
            permissions.put(VIEW_ANALYTICS, true);
            permissions.put(VIEW_PAYMENTS, true);
            permissions.put(VIEW_REPORTS, true);
            permissions.put(MANAGE_SETTINGS, true);
            permissions.put(MANAGE_NOTIFICATIONS, true);
            permissions.put(MANAGE_TASKS, true);
            permissions.put(MANAGE_DOCUMENTS, true);
            permissions.put(MANAGE_INVOICES, true);
            permissions.put(ASSIGN_TASKS, true);
            permissions.put(MANAGE_BUSES, true);
            permissions.put(MANAGE_ROUTES, true);
            permissions.put(MANAGE_DRIVERS, true);
            permissions.put(VIEW_BUS_ANALYTICS, true);
            return permissions;
        }

        if (role == Role.BUS_MANAGER) {
            permissions.put(MANAGE_BUSES, true);
            permissions.put(MANAGE_ROUTES, true);
            permissions.put(MANAGE_DRIVERS, true);
            permissions.put(VIEW_BUS_ANALYTICS, true);
            return permissions;
        }

        permissions.put(VIEW_ANALYTICS, true);
        permissions.put(VIEW_REPORTS, true);
        permissions.put(MANAGE_TASKS, true);
        permissions.put(MANAGE_DOCUMENTS, true);
        return permissions;
    }

    public static Map<String, Boolean> resolve(Role role, Map<String, Boolean> overrides) {
        Map<String, Boolean> resolved = new HashMap<>(defaultsFor(role));
        if (overrides != null) {
            resolved.putAll(overrides);
        }
        return resolved;
    }
}
