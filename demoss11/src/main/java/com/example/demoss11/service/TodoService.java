package com.example.demoss11.service;

import com.example.demoss11.model.dto.request.TodoCreateRequest;
import com.example.demoss11.model.dto.request.TodoUpdateRequest;
import com.example.demoss11.model.dto.response.TodoResponse;
import com.example.demoss11.model.entity.Priority;

import java.util.List;

public interface TodoService {

    List<TodoResponse> getAllTodos(Boolean completed, Priority priority, String keyword);

    TodoResponse getTodoById(Long id);

    TodoResponse createTodo(TodoCreateRequest request);

    TodoResponse updateTodo(Long id, TodoUpdateRequest request);

    TodoResponse toggleTodoStatus(Long id);

    void deleteTodo(Long id);
}
