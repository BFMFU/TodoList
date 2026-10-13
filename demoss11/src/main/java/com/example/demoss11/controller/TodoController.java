package com.example.demoss11.controller;

import com.example.demoss11.model.dto.request.TodoCreateRequest;
import com.example.demoss11.model.dto.request.TodoUpdateRequest;
import com.example.demoss11.model.dto.response.ApiDataResponse;
import com.example.demoss11.model.dto.response.TodoResponse;
import com.example.demoss11.model.entity.Priority;
import com.example.demoss11.service.TodoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/todos")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TodoController {

    private final TodoService todoService;

    @GetMapping
    public ResponseEntity<ApiDataResponse<List<TodoResponse>>> getAllTodos(
            @RequestParam(required = false) Boolean completed,
            @RequestParam(required = false) Priority priority,
            @RequestParam(required = false) String keyword) {
        return ResponseEntity.ok(new ApiDataResponse<>(
                true,
                "Lấy danh sách công việc thành công",
                todoService.getAllTodos(completed, priority, keyword),
                null,
                HttpStatus.OK
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiDataResponse<TodoResponse>> getTodoById(@PathVariable Long id) {
        return ResponseEntity.ok(new ApiDataResponse<>(
                true,
                "Lấy thông tin công việc thành công",
                todoService.getTodoById(id),
                null,
                HttpStatus.OK
        ));
    }

    @PostMapping
    public ResponseEntity<ApiDataResponse<TodoResponse>> createTodo(
            @Valid @RequestBody TodoCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(new ApiDataResponse<>(
                true,
                "Tạo công việc mới thành công",
                todoService.createTodo(request),
                null,
                HttpStatus.CREATED
        ));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiDataResponse<TodoResponse>> updateTodo(
            @PathVariable Long id,
            @Valid @RequestBody TodoUpdateRequest request) {
        return ResponseEntity.ok(new ApiDataResponse<>(
                true,
                "Cập nhật công việc thành công",
                todoService.updateTodo(id, request),
                null,
                HttpStatus.OK
        ));
    }

    @PatchMapping("/{id}/toggle")
    public ResponseEntity<ApiDataResponse<TodoResponse>> toggleTodoStatus(@PathVariable Long id) {
        return ResponseEntity.ok(new ApiDataResponse<>(
                true,
                "Cập nhật trạng thái công việc thành công",
                todoService.toggleTodoStatus(id),
                null,
                HttpStatus.OK
        ));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiDataResponse<Void>> deleteTodo(@PathVariable Long id) {
        todoService.deleteTodo(id);
        return ResponseEntity.ok(new ApiDataResponse<>(
                true,
                "Xóa công việc thành công",
                null,
                null,
                HttpStatus.OK
        ));
    }
}
