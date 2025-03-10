package request

import (
	"net/url"

	"github.com/grafana/grafana/pkg/tsdb/cloudwatch/constants"
)

type DimensionKeysRequestType uint32

const (
	StandardDimensionKeysRequest DimensionKeysRequestType = iota
	FilterDimensionKeysRequest
	CustomMetricDimensionKeysRequest
)

type DimensionKeysRequest struct {
	*ResourceRequest
	Namespace       string
	MetricName      string
	DimensionFilter []*Dimension
}

func (q *DimensionKeysRequest) Type() DimensionKeysRequestType {
	if _, exist := constants.NamespaceMetricsMap[q.Namespace]; !exist {
		return CustomMetricDimensionKeysRequest
	}

	if len(q.DimensionFilter) > 0 {
		return FilterDimensionKeysRequest
	}

	return StandardDimensionKeysRequest
}

func GetDimensionKeysRequest(parameters url.Values) (*DimensionKeysRequest, error) {
	resourceRequest, err := getResourceRequest(parameters)
	if err != nil {
		return nil, err
	}

	request := &DimensionKeysRequest{
		ResourceRequest: resourceRequest,
		Namespace:       parameters.Get("namespace"),
		MetricName:      parameters.Get("metricName"),
		DimensionFilter: []*Dimension{},
	}

	dimensions, err := parseDimensionFilter(parameters.Get("dimensionFilters"))
	if err != nil {
		return nil, err
	}

	request.DimensionFilter = dimensions

	return request, nil
}
