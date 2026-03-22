package com.travelcrm.shared.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {
    private T data;
    private String error;
    private List<String> details;

    public static <T> ApiResponse<T> success(T data) {
        ApiResponse<T> r = new ApiResponse<>();
        r.setData(data);
        return r;
    }

    public static <T> ApiResponse<T> error(String error) {
        ApiResponse<T> r = new ApiResponse<>();
        r.setError(error);
        return r;
    }

    public static <T> ApiResponse<T> error(String error, List<String> details) {
        ApiResponse<T> r = new ApiResponse<>();
        r.setError(error);
        r.setDetails(details);
        return r;
    }
}
