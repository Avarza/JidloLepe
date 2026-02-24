package org.example.repository;

import org.example.entity.ScanHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ScanHistoryRepository extends JpaRepository<ScanHistory, Long> {
    List<ScanHistory> findTop20ByUserEmailOrderByScannedAtDesc(String email);
}