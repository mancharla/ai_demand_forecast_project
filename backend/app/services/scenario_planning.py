"""
Scenario Planning Service - What-If Analysis
Handles scenario generation, variable modification, and impact analysis
"""
from typing import Dict, List, Optional, Any
from datetime import datetime
from sqlalchemy.orm import Session
import json


class ScenarioPlanningService:
    """Service for managing forecast scenarios and what-if analysis"""
    
    @staticmethod
    def create_scenario(
        project_id: int,
        creator_id: int,
        name: str,
        description: str,
        scenario_type: str,
        variables: Dict[str, Any],
        db: Session
    ):
        """Create a new forecast scenario"""
        from app.models_extended import ForecastScenario
        
        scenario = ForecastScenario(
            project_id=project_id,
            creator_id=creator_id,
            name=name,
            description=description,
            scenario_type=scenario_type,
            variables=variables
        )
        
        db.add(scenario)
        db.commit()
        db.refresh(scenario)
        
        return scenario
    
    @staticmethod
    def generate_scenario_forecast(
        scenario_id: int,
        base_forecast_data: List[Dict],
        variables: Dict[str, Any],
        db: Session
    ) -> Dict[str, Any]:
        """
        Generate modified forecast based on scenario variables
        
        Variables can include:
        - sales_growth: percentage increase/decrease
        - seasonality: seasonal factor
        - demand_elasticity: price sensitivity
        - market_share: market share change
        - competition_impact: competitive pressure
        """
        
        modified_forecast = []
        kpi_impact = {}
        
        for item in base_forecast_data:
            modified_item = item.copy()
            original_sales = item.get('sales', 0)
            
            # Apply sales growth
            if 'sales_growth' in variables:
                growth_rate = variables['sales_growth'] / 100
                original_sales = original_sales * (1 + growth_rate)
            
            # Apply seasonality
            if 'seasonality' in variables:
                seasonality_factor = variables['seasonality']
                original_sales = original_sales * seasonality_factor
            
            # Apply demand elasticity
            if 'demand_elasticity' in variables and 'price_change' in variables:
                elasticity = variables['demand_elasticity']
                price_change = variables['price_change'] / 100
                demand_change = elasticity * price_change
                original_sales = original_sales * (1 + demand_change)
            
            # Apply market share change
            if 'market_share' in variables:
                market_share = variables['market_share'] / 100
                original_sales = original_sales * (1 + market_share)
            
            # Apply competition impact
            if 'competition_impact' in variables:
                competition_factor = variables['competition_impact']
                original_sales = original_sales * (1 - competition_factor)
            
            modified_item['modified_sales'] = original_sales
            modified_item['change_percentage'] = ((original_sales - item.get('sales', 0)) / item.get('sales', 1)) * 100
            modified_forecast.append(modified_item)
        
        # Calculate KPI impacts
        total_original_sales = sum(item.get('sales', 0) for item in base_forecast_data)
        total_modified_sales = sum(item.get('modified_sales', 0) for item in modified_forecast)
        
        kpi_impact = {
            'total_sales_change': total_modified_sales - total_original_sales,
            'total_sales_change_percentage': ((total_modified_sales - total_original_sales) / total_original_sales * 100) if total_original_sales > 0 else 0,
            'average_change_per_product': (total_modified_sales - total_original_sales) / len(modified_forecast) if modified_forecast else 0,
            'products_increasing': sum(1 for item in modified_forecast if item.get('change_percentage', 0) > 0),
            'products_decreasing': sum(1 for item in modified_forecast if item.get('change_percentage', 0) < 0),
        }
        
        return {
            'forecast': modified_forecast,
            'kpi_impact': kpi_impact,
            'total_original_sales': total_original_sales,
            'total_modified_sales': total_modified_sales,
            'generated_at': datetime.utcnow().isoformat()
        }
    
    @staticmethod
    def compare_scenarios(
        scenario_ids: List[int],
        db: Session
    ) -> Dict[str, Any]:
        """Compare multiple scenarios"""
        from app.models_extended import ForecastScenario
        
        scenarios = db.query(ForecastScenario).filter(
            ForecastScenario.id.in_(scenario_ids)
        ).all()
        
        comparison = {
            'scenarios': [],
            'comparison_metrics': {}
        }
        
        for scenario in scenarios:
            comparison['scenarios'].append({
                'id': scenario.id,
                'name': scenario.name,
                'type': scenario.scenario_type,
                'variables': scenario.variables,
                'kpi_impact': scenario.kpi_impact
            })
        
        # Calculate comparative metrics
        if scenarios:
            impacts = [s.kpi_impact or {} for s in scenarios]
            
            comparison['comparison_metrics'] = {
                'best_sales_scenario': max(
                    (s for s in scenarios if s.kpi_impact),
                    key=lambda x: x.kpi_impact.get('total_modified_sales', 0)
                ).name if scenarios else None,
                'worst_sales_scenario': min(
                    (s for s in scenarios if s.kpi_impact),
                    key=lambda x: x.kpi_impact.get('total_modified_sales', 0)
                ).name if scenarios else None,
                'average_sales_impact': sum(
                    s.kpi_impact.get('total_sales_change', 0) for s in scenarios if s.kpi_impact
                ) / len([s for s in scenarios if s.kpi_impact]) if any(s.kpi_impact for s in scenarios) else 0
            }
        
        return comparison
    
    @staticmethod
    def get_predefined_scenarios():
        """Get predefined scenario templates"""
        return {
            'optimistic': {
                'name': 'Optimistic Growth',
                'description': 'Best-case scenario with positive market conditions',
                'variables': {
                    'sales_growth': 15,
                    'seasonality': 1.1,
                    'market_share': 5,
                    'competition_impact': 0.05
                }
            },
            'pessimistic': {
                'name': 'Pessimistic Decline',
                'description': 'Worst-case scenario with negative market conditions',
                'variables': {
                    'sales_growth': -15,
                    'seasonality': 0.9,
                    'market_share': -5,
                    'competition_impact': 0.15
                }
            },
            'conservative': {
                'name': 'Conservative Baseline',
                'description': 'Conservative estimate with minimal changes',
                'variables': {
                    'sales_growth': 3,
                    'seasonality': 1.0,
                    'market_share': 0,
                    'competition_impact': 0.05
                }
            },
            'aggressive': {
                'name': 'Aggressive Expansion',
                'description': 'Aggressive growth targeting market leadership',
                'variables': {
                    'sales_growth': 25,
                    'seasonality': 1.15,
                    'market_share': 10,
                    'competition_impact': 0.1
                }
            },
            'price_increase': {
                'name': 'Price Increase Scenario',
                'description': 'Impact of price increase on demand',
                'variables': {
                    'price_change': 10,
                    'demand_elasticity': -0.8,
                    'market_share': 2
                }
            },
            'price_decrease': {
                'name': 'Price Decrease Scenario',
                'description': 'Impact of price decrease on demand and volume',
                'variables': {
                    'price_change': -10,
                    'demand_elasticity': -1.2,
                    'market_share': 5
                }
            }
        }
    
    @staticmethod
    def analyze_scenario_sensitivity(
        base_forecast: List[Dict],
        variable_name: str,
        variable_range: tuple,  # (min, max)
        step: float = 5
    ) -> List[Dict]:
        """
        Perform sensitivity analysis on a variable
        Shows how forecast changes with different variable values
        """
        results = []
        current_value = variable_range[0]
        
        while current_value <= variable_range[1]:
            variables = {variable_name: current_value}
            forecast_result = ScenarioPlanningService.generate_scenario_forecast(
                scenario_id=None,
                base_forecast_data=base_forecast,
                variables=variables,
                db=None
            )
            
            results.append({
                'variable_value': current_value,
                'total_sales': forecast_result['total_modified_sales'],
                'change_percentage': forecast_result['kpi_impact']['total_sales_change_percentage']
            })
            
            current_value += step
        
        return results
    
    @staticmethod
    def save_scenario_results(
        scenario_id: int,
        forecast_results: Dict,
        kpi_impact: Dict,
        db: Session
    ):
        """Save scenario forecast results"""
        from app.models_extended import ForecastScenario
        
        scenario = db.query(ForecastScenario).filter(
            ForecastScenario.id == scenario_id
        ).first()
        
        if scenario:
            scenario.forecast_results = forecast_results
            scenario.kpi_impact = kpi_impact
            scenario.updated_at = datetime.utcnow()
            db.commit()
    
    @staticmethod
    def publish_scenario(
        scenario_id: int,
        db: Session
    ):
        """Publish scenario for team access"""
        from app.models_extended import ForecastScenario
        
        scenario = db.query(ForecastScenario).filter(
            ForecastScenario.id == scenario_id
        ).first()
        
        if scenario:
            scenario.is_published = True
            scenario.updated_at = datetime.utcnow()
            db.commit()
        
        return scenario
    
    @staticmethod
    def clone_scenario(
        scenario_id: int,
        new_name: str,
        creator_id: int,
        db: Session
    ):
        """Clone an existing scenario"""
        from app.models_extended import ForecastScenario
        
        original = db.query(ForecastScenario).filter(
            ForecastScenario.id == scenario_id
        ).first()
        
        if not original:
            return None
        
        cloned = ForecastScenario(
            project_id=original.project_id,
            creator_id=creator_id,
            name=new_name,
            description=original.description,
            scenario_type=original.scenario_type,
            variables=original.variables.copy() if original.variables else {},
            is_published=False
        )
        
        db.add(cloned)
        db.commit()
        db.refresh(cloned)
        
        return cloned
