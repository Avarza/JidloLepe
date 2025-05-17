package org.example.controller;

import org.example.dto.UserDTO;
import org.example.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    @Autowired
    private UserService userService;

    @PutMapping("/allergens")
    public UserDTO updateUserAllergens(@RequestBody UserDTO dto) {
        return userService.updateUserAllergens(dto);
    }
}
