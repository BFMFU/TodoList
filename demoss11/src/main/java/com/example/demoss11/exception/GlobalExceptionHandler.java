package com.example.demoss11.exception;

import com.example.demoss11.model.dto.response.ApiDataResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiDataResponse<Object>> handleResourceNotFoundException(ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ApiDataResponse<>(
                false,
                ex.getMessage(),
                null,
                null,
                HttpStatus.NOT_FOUND
        ));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiDataResponse<Object>> handleValidationException(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = new HashMap<>();
        for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
            fieldErrors.put(fieldError.getField(), fieldError.getDefaultMessage());
        }

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiDataResponse<>(
                false,
                "Dữ liệu gửi lên không hợp lệ",
                null,
                fieldErrors,
                HttpStatus.BAD_REQUEST
        ));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiDataResponse<Object>> handleIllegalArgumentException(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiDataResponse<>(
                false,
                ex.getMessage(),
                null,
                null,
                HttpStatus.BAD_REQUEST
        ));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiDataResponse<Object>> handleGlobalException(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ApiDataResponse<>(
                false,
                "Đã xảy ra lỗi hệ thống: " + ex.getMessage(),
                null,
                null,
                HttpStatus.INTERNAL_SERVER_ERROR
        ));
    }
}
