package com.structshield;

import com.structshield.domain.User;
import com.structshield.domain.UserRole;
import com.structshield.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootApplication
public class StructShieldApplication {

    public static void main(String[] args) {
        SpringApplication.run(StructShieldApplication.class, args);
    }

    @Bean
    public CommandLineRunner seedDefaultUsers(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            if (!userRepository.existsByUsername("analyst")) {
                User analyst = new User();
                analyst.setUsername("analyst");
                analyst.setPasswordHash(passwordEncoder.encode("analyst123"));
                analyst.setRole(UserRole.ROLE_COMPLIANCE_ANALYST);
                analyst.setEnabled(true);
                userRepository.save(analyst);
            }

            if (!userRepository.existsByUsername("admin")) {
                User admin = new User();
                admin.setUsername("admin");
                admin.setPasswordHash(passwordEncoder.encode("admin123"));
                admin.setRole(UserRole.ROLE_ADMIN);
                admin.setEnabled(true);
                userRepository.save(admin);
            }
        };
    }
}
