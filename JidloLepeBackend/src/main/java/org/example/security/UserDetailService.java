package org.example.security;

import org.example.entity.User;
import org.example.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserDetailService implements UserDetailsService {

    private final UserService userService;

    @Autowired
    public UserDetailService(UserService userService) {
        this.userService = userService;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        // Předpokládám, že UserService umí vrátit entitu User, nebo si uprav metodu:
        User user = userService.getUserEntityByEmail(email); // Přidej do UserService metodu, která vrací User entitu

        if (user == null) {
            throw new UsernameNotFoundException("Uživatel nenalezen: " + email);
        }

        // Převedeme role z entity na GrantedAuthority
        List<SimpleGrantedAuthority> authorities = user.getRoles().stream()
                .map(role -> new SimpleGrantedAuthority(role.getName()))
                .collect(Collectors.toList());

        return new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPassword(),  // musí být uložené heslo
                authorities
        );
    }
}
