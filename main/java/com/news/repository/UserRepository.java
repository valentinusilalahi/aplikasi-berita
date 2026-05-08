package com.news.repository;

import com.news.entity.User;
import com.news.entity.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    List<User> findByRole(UserRole role);
    List<User> findByActiveTrue();
    
    @Query("SELECT u FROM User u WHERE u.active = true AND u.role IN :roles")
    List<User> findActiveUsersByRoles(@Param("roles") List<UserRole> roles);
}
