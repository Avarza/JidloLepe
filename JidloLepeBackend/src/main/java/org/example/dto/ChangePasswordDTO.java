package org.example.dto;

import lombok.Getter;
import lombok.Setter;

// ── Change password request ───────────────────────────────────────────────────
@Getter
@Setter
public class ChangePasswordDTO {
    private String oldPassword;
    private String newPassword;
}