package org.example.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
public class ScanHistoryDTO {
    private String code;
    private String product_name;
    private String image_front_url;
    private LocalDateTime scannedAt;
}