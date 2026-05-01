def test_health_returns_200(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200


def test_health_response_fields(client):
    data = client.get("/api/v1/health").json()
    assert data["status"] == "ok"
    assert data["version"] == "0.1.0"
    assert "neo4j" in data
    assert "redis" in data
