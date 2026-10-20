package za.ac.capaciti.capacitionlineregisterbackend.service;

import java.util.List;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.web.util.matcher.IpAddressMatcher;
import org.springframework.stereotype.Service;

@Service
public class IpWhitelistService {

    public String extractClientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor == null || forwardedFor.isBlank()) {
            return request.getRemoteAddr();
        }

        int commaIndex = forwardedFor.indexOf(',');
        String clientIp = (commaIndex >= 0 ? forwardedFor.substring(0, commaIndex) : forwardedFor).trim();
        return clientIp.isEmpty() ? request.getRemoteAddr() : clientIp;
    }

    public boolean isWhitelisted(String ip, List<String> cidrs) {
        if (ip == null || ip.isBlank() || cidrs == null) {
            return false;
        }

        for (String cidr : cidrs) {
            if (cidr == null || cidr.isBlank()) {
                continue;
            }

            try {
                if (new IpAddressMatcher(cidr.trim()).matches(ip.trim())) {
                    return true;
                }
            } catch (IllegalArgumentException ignored) {
            }
        }

        return false;
    }

    public String toCidr(String ip) {
        if (ip == null || ip.isBlank()) {
            return null;
        }

        String normalizedIp = ip.trim();
        return normalizedIp + (normalizedIp.contains(":") ? "/128" : "/32");
    }
}