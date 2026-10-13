package com.example.demoss11.config;

import com.example.demoss11.model.entity.Priority;
import com.example.demoss11.model.entity.Todo;
import com.example.demoss11.repository.TodoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final TodoRepository todoRepository;

    @Override
    public void run(String... args) {
        if (todoRepository.count() == 0) {
            Todo todo1 = Todo.builder()
                    .title("Học Spring Boot RESTful API")
                    .description("Tìm hiểu kiến trúc Controller - Service - Repository và DTO")
                    .completed(true)
                    .priority(Priority.HIGH)
                    .dueDate(LocalDate.now().plusDays(1))
                    .build();

            Todo todo2 = Todo.builder()
                    .title("Thiết kế cơ sở dữ liệu TodoList")
                    .description("Cấu hình JPA Entity, H2 database và Hibernate")
                    .completed(true)
                    .priority(Priority.MEDIUM)
                    .dueDate(LocalDate.now().plusDays(2))
                    .build();

            Todo todo3 = Todo.builder()
                    .title("Viết tài liệu API với Postman / cURL")
                    .description("Kiểm thử các API CRUD, Validate Request và Global Exception")
                    .completed(false)
                    .priority(Priority.HIGH)
                    .dueDate(LocalDate.now().plusDays(3))
                    .build();

            todoRepository.saveAll(List.of(todo1, todo2, todo3));
        }
    }
}
