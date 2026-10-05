package com.example.pms.repository;

import com.example.pms.model.Theme;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ThemeRepository extends JpaRepository<Theme,Integer> {

    java.util.List<Theme> findByCreatedBy_UserIdAndStatusTrue(Integer userId);

    java.util.Optional<Theme> findByIdAndCreatedBy_UserId(Integer id, Integer userId);

}
