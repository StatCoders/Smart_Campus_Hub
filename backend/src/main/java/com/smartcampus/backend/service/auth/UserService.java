package com.smartcampus.backend.service.auth;

import com.smartcampus.backend.dto.auth.AuthResponse;
import com.smartcampus.backend.dto.auth.LoginRequest;
import com.smartcampus.backend.dto.auth.SignupRequest;
import com.smartcampus.backend.model.auth.Role;
import com.smartcampus.backend.model.auth.User;
import com.smartcampus.backend.repository.auth.UserRepository;
import com.smartcampus.backend.security.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

@Service
public class UserService implements UserDetailsService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public UserService(
	    UserRepository userRepository,
	    PasswordEncoder passwordEncoder,
	    JwtService jwtService,
	    AuthenticationManager authenticationManager
    ) {
	this.userRepository = userRepository;
	this.passwordEncoder = passwordEncoder;
	this.jwtService = jwtService;
	this.authenticationManager = authenticationManager;
    }

    public AuthResponse register(SignupRequest request) {

	if (userRepository.existsByEmail(request.getEmail())) {
	    throw new ResponseStatusException(BAD_REQUEST, "Email already in use");
	}

	User user = new User(
		request.getEmail().trim().toLowerCase(),
		request.getFullName().trim(),
		passwordEncoder.encode(request.getPassword()),
		Role.USER
	);

	User savedUser = userRepository.save(user);
	String token = jwtService.generateToken(savedUser);

	return new AuthResponse(
		token,
		savedUser.getId(),
		savedUser.getEmail(),
		savedUser.getFullName(),
		savedUser.getRole()
	);
    }

    public AuthResponse login(LoginRequest request) {

	authenticationManager.authenticate(
		new UsernamePasswordAuthenticationToken(
			request.getEmail().trim().toLowerCase(),
			request.getPassword()
		)
	);

	User user = userRepository.findByEmail(request.getEmail().trim().toLowerCase())
		.orElseThrow(() -> new UsernameNotFoundException("User not found"));

	String token = jwtService.generateToken(user);
	return new AuthResponse(
		token,
		user.getId(),
		user.getEmail(),
		user.getFullName(),
		user.getRole()
	);
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
	return userRepository.findByEmail(username)
		.orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }
}
