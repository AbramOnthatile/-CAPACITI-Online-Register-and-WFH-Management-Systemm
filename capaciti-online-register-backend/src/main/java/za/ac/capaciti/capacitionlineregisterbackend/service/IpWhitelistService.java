package za.ac.capaciti.capacitionlineregisterbackend.service;

import java.util.List;
import java.util.regex.Pattern;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.web.util.matcher.IpAddressMatcher;
import org.springframework.stereotype.Service;

@Service
public class IpWhitelistService {

    private static final Pattern IP_LITERAL_OR_CIDR = Pattern.compile("[0-9a-fA-F:.]+(?:/[0-9]{1,3})?");
    private static final Pattern IP_LITERAL = Pattern.compile("[0-9a-fA-F:.]+");

    private final List<IpAddressMatcher> trustedProxyMatchers;

    public IpWhitelistService(@Value("${app.proxy.trusted-proxies:}") String trustedProxies) {
        this.trustedProxyMatchers = parseTrustedProxies(trustedProxies);
    }

    public String extractClientIp(HttpServletRequest request) {
        String remoteAddress = request.getRemoteAddr();
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (!isIpLiteral(remoteAddress)) {
            return null;
        }
        if (!isTrustedProxy(remoteAddress)) {
            return remoteAddress;
        }
        if (forwardedFor == null || forwardedFor.isBlank()) {
            return null;
        }

        String[] forwardedAddresses = forwardedFor.split(",", -1);
        for (int index = forwardedAddresses.length - 1; index >= 0; index--) {
            String address = forwardedAddresses[index].trim();
            if (!isIpLiteral(address)) {
                return null;
            }
            if (!isTrustedProxy(address)) {
                return address;
            }
        }

        return null;
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
        if (!isIpLiteral(normalizedIp)) {
            return null;
        }
        return normalizedIp + (normalizedIp.contains(":") ? "/128" : "/32");
    }

    private List<IpAddressMatcher> parseTrustedProxies(String trustedProxies) {
        if (trustedProxies == null || trustedProxies.isBlank()) {
            return List.of();
        }

        return java.util.Arrays.stream(trustedProxies.split(","))
                .map(String::trim)
                .filter(proxy -> !proxy.isEmpty())
                .map(proxy -> {
                    if (!IP_LITERAL_OR_CIDR.matcher(proxy).matches()) {
                        throw new IllegalArgumentException("Invalid trusted proxy address or CIDR");
                    }
                    try {
                        return new IpAddressMatcher(proxy);
                    } catch (IllegalArgumentException exception) {
                        throw new IllegalArgumentException("Invalid trusted proxy address or CIDR", exception);
                    }
                })
                .toList();
    }

    private boolean isTrustedProxy(String address) {
        return trustedProxyMatchers.stream().anyMatch(matcher -> matcher.matches(address));
    }

    private boolean isIpLiteral(String address) {
        if (address == null || !IP_LITERAL.matcher(address).matches()) {
            return false;
        }
        try {
            return new IpAddressMatcher(address).matches(address);
        } catch (IllegalArgumentException exception) {
            return false;
        }
    }
}
