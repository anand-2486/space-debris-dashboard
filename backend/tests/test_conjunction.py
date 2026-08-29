import pytest

from app.services.conjunction import refine_conjunction
from app.services.propagator import PropagationResult


def make_result(norad_id, timestamp, x, y, z, vx, vy, vz, status="ok"):
    return PropagationResult(
        norad_cat_id=norad_id,
        timestamp_utc=timestamp,
        x_km=x,
        y_km=y,
        z_km=z,
        vx_km_s=vx,
        vy_km_s=vy,
        vz_km_s=vz,
        status=status,
        error=None if status == "ok" else "test_error",
    )


def test_finds_minimum_separation():
    traj_a = [
        make_result(1, "2026-08-29T12:00:00.000Z",
                    100, 100, 100, 1, 0, 0),
        make_result(1, "2026-08-29T12:01:00.000Z",
                    100, 100, 100, 1, 0, 0),
        make_result(1, "2026-08-29T12:02:00.000Z",
                    100, 100, 100, 1, 0, 0),
    ]

    traj_b = [
        make_result(2, "2026-08-29T12:00:00.000Z",
                    150, 100, 100, 0, 1, 0),
        make_result(2, "2026-08-29T12:01:00.000Z",
                    105, 100, 100, 0, 1, 0),
        make_result(2, "2026-08-29T12:02:00.000Z",
                    120, 100, 100, 0, 1, 0),
    ]

    result = refine_conjunction(traj_a, traj_b)

    assert result["tca_timestamp"] == "2026-08-29T12:01:00.000Z"
    assert result["minimum_separation_km"] == 5.0


def test_relative_velocity():
    traj_a = [
        make_result(1, "2026-08-29T12:00:00.000Z",
                    100, 100, 100, 3, 4, 0),
    ]

    traj_b = [
        make_result(2, "2026-08-29T12:00:00.000Z",
                    110, 100, 100, 0, 0, 0),
    ]

    result = refine_conjunction(traj_a, traj_b)

    # sqrt(3² + 4²) = 5 km/s
    assert result["relative_velocity_kms"] == 5.0


def test_invalid_steps_become_none():
    traj_a = [
        make_result(1, "2026-08-29T12:00:00.000Z",
                    100, 100, 100, 1, 0, 0),
        make_result(1, "2026-08-29T12:01:00.000Z",
                    None, None, None, None, None, None,
                    status="error"),
    ]

    traj_b = [
        make_result(2, "2026-08-29T12:00:00.000Z",
                    110, 100, 100, 0, 0, 0),
        make_result(2, "2026-08-29T12:01:00.000Z",
                    None, None, None, None, None, None,
                    status="error"),
    ]

    result = refine_conjunction(traj_a, traj_b)

    assert result["distance_curve"] == [10.0, None]
    assert result["minimum_separation_km"] == 10.0


def test_raises_when_no_valid_steps():
    traj_a = [
        make_result(1, "2026-08-29T12:00:00.000Z",
                    None, None, None, None, None, None,
                    status="error"),
    ]

    traj_b = [
        make_result(2, "2026-08-29T12:00:00.000Z",
                    None, None, None, None, None, None,
                    status="error"),
    ]

    with pytest.raises(ValueError):
        refine_conjunction(traj_a, traj_b)