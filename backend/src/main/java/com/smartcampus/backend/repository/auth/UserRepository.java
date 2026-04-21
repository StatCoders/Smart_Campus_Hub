package com.smartcampus.backend.repository.auth;

import com.smartcampus.backend.model.auth.Role;
import com.smartcampus.backend.model.auth.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    /**
     * Find all active users by role, ordered by first name
     * @param role The role to filter by
     * @return List of active users with the given role
     */
    List<User> findByRoleAndIsActiveTrueOrderByFirstName(Role role);

    /**
     * Find all active users
     * @return List of all active users
     */
    List<User> findByIsActiveTrueOrderByFirstName();
}
