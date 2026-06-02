package com.travelcrm.config;

import com.travelcrm.modules.auth.Role;
import com.travelcrm.modules.auth.UserEntity;
import com.travelcrm.modules.auth.UserPermissions;
import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Getter
@AllArgsConstructor
public class UserPrincipal implements UserDetails {
    private UUID id;
    private String email;
    private String password;
    private Role role;
    private boolean active;
    private Map<String, Boolean> permissions;

    public static UserPrincipal from(UserEntity u) {
        return new UserPrincipal(
            u.getId(),
            u.getEmail(),
            u.getPasswordHash(),
            u.getRole(),
            u.isActive(),
            UserPermissions.resolve(u.getRole(), u.getPermissions())
        );
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return Stream.concat(
                Stream.of(new SimpleGrantedAuthority("ROLE_" + role.name())),
                permissions.entrySet().stream()
                    .filter((entry) -> Boolean.TRUE.equals(entry.getValue()))
                    .map((entry) -> new SimpleGrantedAuthority(entry.getKey()))
            )
            .collect(Collectors.toList());
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return active;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return active;
    }
}
