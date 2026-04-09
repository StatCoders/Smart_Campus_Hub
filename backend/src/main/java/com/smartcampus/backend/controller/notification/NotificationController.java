package com.smartcampus.backend.controller.notification;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

	@GetMapping("/admin")
	@PreAuthorize("hasRole('ADMIN')")
	public String adminNotifications() {
		return "ADMIN notifications endpoint";
	}

	@GetMapping("/user")
	@PreAuthorize("hasAnyRole('USER','ADMIN')")
	public String userNotifications() {
		return "USER/ADMIN notifications endpoint";
	}
}
