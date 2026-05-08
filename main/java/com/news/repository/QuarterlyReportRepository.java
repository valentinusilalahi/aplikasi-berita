package com.news.repository;

import com.news.entity.QuarterlyReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface QuarterlyReportRepository extends JpaRepository<QuarterlyReport, Long> {
    Optional<QuarterlyReport> findByQuarterAndYear(Integer quarter, Integer year);
    List<QuarterlyReport> findByYearOrderByQuarter(Integer year);
    List<QuarterlyReport> findAllByOrderByYearDescQuarterDesc();
}
