from app.services.candidate_filter import filter_candidate_pairs
from app.services.propagator import PropagationResult


def make_result(norad_id, x, y, z):
    return PropagationResult(
        norad_cat_id=norad_id,
        timestamp_utc="2026-08-29T12:00:00.000Z",
        x_km=x,
        y_km=y,
        z_km=z,
        vx_km_s=1.0,
        vy_km_s=1.0,
        vz_km_s=1.0,
        status="ok",
        error=None,
    )


def test_pair_within_threshold():
    trajectories = {
        1: [make_result(1, 100, 100, 100)],
        2: [make_result(2, 110, 100, 100)],
    }

    result = filter_candidate_pairs(
        trajectories,
        distance_threshold_km=25.0
    )

    assert len(result) == 1
    assert result[0]["norad_cat_id_a"] == 1
    assert result[0]["norad_cat_id_b"] == 2
    assert result[0]["coarse_min_distance_km"] == 10.0


def test_pair_outside_threshold():
    trajectories = {
        1: [make_result(1, 100, 100, 100)],
        2: [make_result(2, 130, 100, 100)],
    }

    result = filter_candidate_pairs(
        trajectories,
        distance_threshold_km=25.0
    )

    assert len(result) == 0


def test_multiple_timestamps_finds_minimum():
    trajectories = {
        1: [
            make_result(1, 100, 100, 100),
            make_result(1, 100, 100, 100),
        ],
        2: [
            make_result(2, 150, 100, 100),
            make_result(2, 105, 100, 100),
        ],
    }

    result = filter_candidate_pairs(
        trajectories,
        distance_threshold_km=25.0
    )

    assert len(result) == 1
    assert result[0]["coarse_tca_index"] == 1
    assert result[0]["coarse_min_distance_km"] == 5.0


if __name__ == "__main__":
    test_pair_within_threshold()
    test_pair_outside_threshold()
    test_multiple_timestamps_finds_minimum()
    print("All Member 3 candidate-filter tests passed!")