package za.ac.capaciti.capacitionlineregisterbackend.service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;

import javax.crypto.SecretKey;

import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.DecodingException;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

    private static final String INVALID_SECRET_MESSAGE =
            "jwt.secret must be a Base64 value of at least 32 bytes";

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration-minutes}")
    private long expirationMinutes;

    private SecretKey key;

    @PostConstruct
    void initializeKey() {
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException(INVALID_SECRET_MESSAGE);
        }

        byte[] decodedSecret;
        try {
            decodedSecret = Decoders.BASE64.decode(secret);
        } catch (DecodingException exception) {
            throw new IllegalStateException(INVALID_SECRET_MESSAGE, exception);
        }

        if (decodedSecret.length < 32) {
            throw new IllegalStateException(INVALID_SECRET_MESSAGE);
        }

        key = Keys.hmacShaKeyFor(decodedSecret);
    }

    public String generateToken(UserDetails userDetails) {
        String role = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .findFirst()
                .map(authority -> authority.startsWith("ROLE_") ? authority.substring(5) : authority)
                .orElseThrow();
        Instant now = Instant.now();

        return Jwts.builder()
                .claim("role", role)
                .subject(userDetails.getUsername())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(expirationMinutes, ChronoUnit.MINUTES)))
                .signWith(key)
                .compact();
    }

    public Instant extractExpiration(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getExpiration()
                .toInstant();
    }

    public String extractEmail(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        if (!userDetails.isEnabled()) {
            return false;
        }

        try {
            return userDetails.getUsername().equals(extractEmail(token))
                    && extractExpiration(token).isAfter(Instant.now());
        } catch (JwtException exception) {
            return false;
        }
    }
}