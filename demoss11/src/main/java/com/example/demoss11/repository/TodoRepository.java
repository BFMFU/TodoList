package com.example.demoss11.repository;

import com.example.demoss11.model.entity.Priority;
import com.example.demoss11.model.entity.Todo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TodoRepository extends JpaRepository<Todo, Long> {

    List<Todo> findByCompleted(Boolean completed);

    List<Todo> findByPriority(Priority priority);

    List<Todo> findByTitleContainingIgnoreCase(String keyword);

    List<Todo> findByCompletedAndPriority(Boolean completed, Priority priority);
}
