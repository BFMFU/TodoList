package com.example.demoss11.service.impl;

import com.example.demoss11.exception.ResourceNotFoundException;
import com.example.demoss11.model.dto.request.TodoCreateRequest;
import com.example.demoss11.model.dto.request.TodoUpdateRequest;
import com.example.demoss11.model.dto.response.TodoResponse;
import com.example.demoss11.model.entity.Priority;
import com.example.demoss11.model.entity.Todo;
import com.example.demoss11.repository.TodoRepository;
import com.example.demoss11.service.TodoService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TodoServiceImpl implements TodoService {

    private final TodoRepository todoRepository;

    @Override
    @Transactional(readOnly = true)
    public List<TodoResponse> getAllTodos(Boolean completed, Priority priority, String keyword) {
        List<Todo> todos;

        if (keyword != null && !keyword.trim().isEmpty()) {
            todos = todoRepository.findByTitleContainingIgnoreCase(keyword.trim());
        } else if (completed != null && priority != null) {
            todos = todoRepository.findByCompletedAndPriority(completed, priority);
        } else if (completed != null) {
            todos = todoRepository.findByCompleted(completed);
        } else if (priority != null) {
            todos = todoRepository.findByPriority(priority);
        } else {
            todos = todoRepository.findAll();
        }

        return todos.stream()
                .map(TodoResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public TodoResponse getTodoById(Long id) {
        Todo todo = findTodoById(id);
        return TodoResponse.fromEntity(todo);
    }

    @Override
    @Transactional
    public TodoResponse createTodo(TodoCreateRequest request) {
        Todo todo = Todo.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .priority(request.getPriority() != null ? request.getPriority() : Priority.MEDIUM)
                .dueDate(request.getDueDate())
                .completed(false)
                .build();

        Todo savedTodo = todoRepository.save(todo);
        return TodoResponse.fromEntity(savedTodo);
    }

    @Override
    @Transactional
    public TodoResponse updateTodo(Long id, TodoUpdateRequest request) {
        Todo todo = findTodoById(id);

        todo.setTitle(request.getTitle());
        todo.setDescription(request.getDescription());
        if (request.getCompleted() != null) {
            todo.setCompleted(request.getCompleted());
        }
        if (request.getPriority() != null) {
            todo.setPriority(request.getPriority());
        }
        todo.setDueDate(request.getDueDate());

        Todo updatedTodo = todoRepository.save(todo);
        return TodoResponse.fromEntity(updatedTodo);
    }

    @Override
    @Transactional
    public TodoResponse toggleTodoStatus(Long id) {
        Todo todo = findTodoById(id);
        todo.setCompleted(!Boolean.TRUE.equals(todo.getCompleted()));

        Todo updatedTodo = todoRepository.save(todo);
        return TodoResponse.fromEntity(updatedTodo);
    }

    @Override
    @Transactional
    public void deleteTodo(Long id) {
        Todo todo = findTodoById(id);
        todoRepository.delete(todo);
    }

    private Todo findTodoById(Long id) {
        return todoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Todo", "id", id));
    }
}
