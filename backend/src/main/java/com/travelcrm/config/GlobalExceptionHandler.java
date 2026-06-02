package com.travelcrm.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import jakarta.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.Map;

@ControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Object> handleAll(Exception ex, HttpServletRequest req) {
        log.error("Unhandled exception for {} {}", req.getMethod(), req.getRequestURI(), ex);
        Map<String, Object> body = new HashMap<>();
        body.put("ok", false);
        body.put("error", ex.getClass().getSimpleName());
        String msg = ex.getMessage() == null ? "" : ex.getMessage();
        body.put("message", msg);
        // Return 200 to avoid frontend 500 pages; payload contains error info for debugging
        return ResponseEntity.ok(body);
    }
}
