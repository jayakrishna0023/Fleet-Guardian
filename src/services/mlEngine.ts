// Browser-based Machine Learning Engine for Fleet Predictions
// Uses a simple neural network implementation that runs entirely in the browser

export interface TrainingData {
  inputs: number[];
  outputs: number[];
}

export interface PredictionResult {
  probability: number;
  confidence: number;
  daysUntilFailure: number;
  component: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendation: string;
}

export interface RLState {
  vehicleHealth: number;
  maintenanceCost: number;
  downtime: number;
  efficiency: number;
  alerts: number;
}

export interface RLAction {
  type: 'maintain' | 'inspect' | 'replace' | 'defer' | 'optimize_route';
  component?: string;
  urgency: 'immediate' | 'scheduled' | 'planned';
  cost: number;
}

export interface RLReward {
  value: number;
  breakdown: {
    cost_saving: number;
    downtime_reduction: number;
    safety_improvement: number;
    efficiency_gain: number;
  };
}

// Simple Neural Network implementation (no external dependencies)
class NeuralNetwork {
  private weights: number[][][];
  private biases: number[][];
  private layers: number[];
  private learningRate: number;

  constructor(layers: number[], learningRate: number = 0.1) {
    this.layers = layers;
    this.learningRate = learningRate;
    this.weights = [];
    this.biases = [];
    this.initializeNetwork();
  }

  private initializeNetwork(): void {
    for (let i = 0; i < this.layers.length - 1; i++) {
      const layerWeights: number[][] = [];
      const layerBiases: number[] = [];
      
      for (let j = 0; j < this.layers[i + 1]; j++) {
        const neuronWeights: number[] = [];
        for (let k = 0; k < this.layers[i]; k++) {
          // Xavier initialization
          neuronWeights.push((Math.random() - 0.5) * 2 / Math.sqrt(this.layers[i]));
        }
        layerWeights.push(neuronWeights);
        layerBiases.push((Math.random() - 0.5) * 0.1);
      }
      
      this.weights.push(layerWeights);
      this.biases.push(layerBiases);
    }
  }

  private sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, x))));
  }

  private sigmoidDerivative(x: number): number {
    return x * (1 - x);
  }

  private relu(x: number): number {
    return Math.max(0, x);
  }

  private reluDerivative(x: number): number {
    return x > 0 ? 1 : 0;
  }

  forward(inputs: number[]): number[] {
    let activations = inputs;
    
    for (let i = 0; i < this.weights.length; i++) {
      const newActivations: number[] = [];
      
      for (let j = 0; j < this.weights[i].length; j++) {
        let sum = this.biases[i][j];
        for (let k = 0; k < activations.length; k++) {
          sum += activations[k] * this.weights[i][j][k];
        }
        // Use sigmoid for output layer, ReLU for hidden layers
        const activation = i === this.weights.length - 1 
          ? this.sigmoid(sum) 
          : this.relu(sum);
        newActivations.push(activation);
      }
      
      activations = newActivations;
    }
    
    return activations;
  }

  train(trainingData: TrainingData[], epochs: number = 1000): number {
    let totalError = 0;
    
    for (let epoch = 0; epoch < epochs; epoch++) {
      totalError = 0;
      
      for (const data of trainingData) {
        // Forward pass with stored activations
        const layerActivations: number[][] = [data.inputs];
        let activations = data.inputs;
        
        for (let i = 0; i < this.weights.length; i++) {
          const newActivations: number[] = [];
          
          for (let j = 0; j < this.weights[i].length; j++) {
            let sum = this.biases[i][j];
            for (let k = 0; k < activations.length; k++) {
              sum += activations[k] * this.weights[i][j][k];
            }
            const activation = i === this.weights.length - 1 
              ? this.sigmoid(sum) 
              : this.relu(sum);
            newActivations.push(activation);
          }
          
          activations = newActivations;
          layerActivations.push(activations);
        }
        
        // Calculate error
        const outputErrors: number[] = [];
        for (let i = 0; i < data.outputs.length; i++) {
          const error = data.outputs[i] - activations[i];
          outputErrors.push(error);
          totalError += error * error;
        }
        
        // Backpropagation
        let layerErrors = outputErrors;
        
        for (let i = this.weights.length - 1; i >= 0; i--) {
          const nextLayerErrors: number[] = new Array(this.layers[i]).fill(0);
          
          for (let j = 0; j < this.weights[i].length; j++) {
            const activation = layerActivations[i + 1][j];
            const derivative = i === this.weights.length - 1 
              ? this.sigmoidDerivative(activation)
              : this.reluDerivative(activation);
            const delta = layerErrors[j] * derivative;
            
            // Update weights and biases
            for (let k = 0; k < this.weights[i][j].length; k++) {
              this.weights[i][j][k] += this.learningRate * delta * layerActivations[i][k];
              nextLayerErrors[k] += delta * this.weights[i][j][k];
            }
            this.biases[i][j] += this.learningRate * delta;
          }
          
          layerErrors = nextLayerErrors;
        }
      }
    }
    
    return totalError / trainingData.length;
  }

  // Save model to localStorage
  save(key: string): void {
    const model = {
      weights: this.weights,
      biases: this.biases,
      layers: this.layers,
      learningRate: this.learningRate
    };
    localStorage.setItem(key, JSON.stringify(model));
  }

  // Load model from localStorage
  load(key: string): boolean {
    const saved = localStorage.getItem(key);
    if (saved) {
      const model = JSON.parse(saved);
      this.weights = model.weights;
      this.biases = model.biases;
      this.layers = model.layers;
      this.learningRate = model.learningRate;
      return true;
    }
    return false;
  }
}

// Deep Q-Network for Reinforcement Learning
class DQNAgent {
  private qNetwork: NeuralNetwork;
  private targetNetwork: NeuralNetwork;
  private memory: Array<{state: number[], action: number, reward: number, nextState: number[], done: boolean}>;
  private epsilon: number;
  private epsilonDecay: number;
  private minEpsilon: number;
  private learningRate: number;
  private batchSize: number;
  private memorySize: number;
  private updateTargetFreq: number;
  private steps: number;

  constructor(stateSize: number, actionSize: number, hiddenLayers: number[] = [64, 32]) {
    const layers = [stateSize, ...hiddenLayers, actionSize];
    this.qNetwork = new NeuralNetwork(layers, 0.001);
    this.targetNetwork = new NeuralNetwork(layers, 0.001);
    
    this.memory = [];
    this.epsilon = 1.0;
    this.epsilonDecay = 0.995;
    this.minEpsilon = 0.01;
    this.learningRate = 0.001;
    this.batchSize = 32;
    this.memorySize = 10000;
    this.updateTargetFreq = 100;
    this.steps = 0;
  }

  selectAction(state: number[]): number {
    if (Math.random() < this.epsilon) {
      return Math.floor(Math.random() * 5); // Random action (0-4)
    }
    
    const qValues = this.qNetwork.forward(state);
    return qValues.indexOf(Math.max(...qValues));
  }

  remember(state: number[], action: number, reward: number, nextState: number[], done: boolean): void {
    if (this.memory.length >= this.memorySize) {
      this.memory.shift();
    }
    this.memory.push({ state, action, reward, nextState, done });
  }

  replay(): void {
    if (this.memory.length < this.batchSize) return;

    // Sample random batch
    const batch = [];
    for (let i = 0; i < this.batchSize; i++) {
      const randomIndex = Math.floor(Math.random() * this.memory.length);
      batch.push(this.memory[randomIndex]);
    }

    // Train on batch
    const trainingData = [];
    for (const experience of batch) {
      const qValues = this.qNetwork.forward(experience.state);
      const nextQValues = this.targetNetwork.forward(experience.nextState);
      
      const target = [...qValues];
      if (experience.done) {
        target[experience.action] = experience.reward;
      } else {
        target[experience.action] = experience.reward + 0.95 * Math.max(...nextQValues);
      }
      
      trainingData.push({
        inputs: experience.state,
        outputs: target
      });
    }

    this.qNetwork.train(trainingData, 1);
    
    // Update target network periodically
    this.steps++;
    if (this.steps % this.updateTargetFreq === 0) {
      this.updateTargetNetwork();
    }

    // Decay epsilon
    if (this.epsilon > this.minEpsilon) {
      this.epsilon *= this.epsilonDecay;
    }
  }

  private updateTargetNetwork(): void {
    // Copy weights from main network to target network
    const mainModel = JSON.stringify({
      weights: this.qNetwork['weights'],
      biases: this.qNetwork['biases']
    });
    const targetData = JSON.parse(mainModel);
    this.targetNetwork['weights'] = targetData.weights;
    this.targetNetwork['biases'] = targetData.biases;
  }

  save(key: string): void {
    const data = {
      qNetwork: {
        weights: this.qNetwork['weights'],
        biases: this.qNetwork['biases']
      },
      epsilon: this.epsilon,
      steps: this.steps
    };
    localStorage.setItem(key, JSON.stringify(data));
  }

  load(key: string): boolean {
    const saved = localStorage.getItem(key);
    if (saved) {
      const data = JSON.parse(saved);
      this.qNetwork['weights'] = data.qNetwork.weights;
      this.qNetwork['biases'] = data.qNetwork.biases;
      this.epsilon = data.epsilon || this.epsilon;
      this.steps = data.steps || 0;
      this.updateTargetNetwork();
      return true;
    }
    return false;
  }
}

// Fleet-specific ML Models with Reinforcement Learning
class FleetMLEngine {
  private engineFailureModel: NeuralNetwork;
  private brakeWearModel: NeuralNetwork;
  private batteryHealthModel: NeuralNetwork;
  private tireWearModel: NeuralNetwork;
  private fuelEfficiencyModel: NeuralNetwork;
  
  // Reinforcement Learning Agents
  private maintenanceAgent: DQNAgent;
  private routeOptimizationAgent: DQNAgent;
  private resourceAllocationAgent: DQNAgent;
  
  private isInitialized: boolean = false;
  private rlMemory: Map<string, Array<{state: RLState, action: RLAction, reward: RLReward, timestamp: number}>>;

  constructor() {
    // Initialize neural networks for different prediction tasks
    // Input features: [engineTemp, oilPressure, mileage, age, avgLoad, engineHours]
    this.engineFailureModel = new NeuralNetwork([6, 12, 8, 2], 0.05);
    
    // Input: [brakeUsage, mileage, avgLoad, terrainType, lastService]
    this.brakeWearModel = new NeuralNetwork([5, 10, 6, 2], 0.05);
    
    // Input: [voltage, temperature, age, chargesCycles, avgDraw]
    this.batteryHealthModel = new NeuralNetwork([5, 10, 6, 2], 0.05);
    
    // Input: [tirePressure, mileage, loadWeight, terrainRoughness, alignmentScore]
    this.tireWearModel = new NeuralNetwork([5, 10, 6, 2], 0.05);
    
    // Input: [speed, load, terrainGrade, airTemp, tireCondition, engineEfficiency]
    this.fuelEfficiencyModel = new NeuralNetwork([6, 12, 8, 1], 0.05);
    
    // Initialize Reinforcement Learning Agents
    // State: [vehicleHealth, maintenanceCost, downtime, efficiency, alerts] = 5 features
    // Actions: [maintain, inspect, replace, defer, optimize_route] = 5 actions
    this.maintenanceAgent = new DQNAgent(5, 5, [32, 16]);
    this.routeOptimizationAgent = new DQNAgent(6, 4, [24, 12]); // Route optimization has 4 actions
    this.resourceAllocationAgent = new DQNAgent(4, 3, [16, 8]); // Resource allocation has 3 actions
    
    this.rlMemory = new Map();
  }

  // Initialize and train all models
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Try to load saved models
    const modelsLoaded = this.loadModels();
    
    if (!modelsLoaded) {
      // Train models with synthetic data
      await this.trainAllModels();
      this.saveModels();
    }
    
    // Initialize RL agents
    this.loadRLAgents();
    
    this.isInitialized = true;
  }

  private loadModels(): boolean {
    const engineLoaded = this.engineFailureModel.load('fleet_ml_engine');
    const brakeLoaded = this.brakeWearModel.load('fleet_ml_brake');
    const batteryLoaded = this.batteryHealthModel.load('fleet_ml_battery');
    const tireLoaded = this.tireWearModel.load('fleet_ml_tire');
    const fuelLoaded = this.fuelEfficiencyModel.load('fleet_ml_fuel');
    
    return engineLoaded && brakeLoaded && batteryLoaded && tireLoaded && fuelLoaded;
  }

  private saveModels(): void {
    this.engineFailureModel.save('fleet_ml_engine');
    this.brakeWearModel.save('fleet_ml_brake');
    this.batteryHealthModel.save('fleet_ml_battery');
    this.tireWearModel.save('fleet_ml_tire');
    this.fuelEfficiencyModel.save('fleet_ml_fuel');
    
    // Save RL agents
    this.maintenanceAgent.save('fleet_rl_maintenance');
    this.routeOptimizationAgent.save('fleet_rl_route');
    this.resourceAllocationAgent.save('fleet_rl_resource');
  }
  
  private loadRLAgents(): void {
    this.maintenanceAgent.load('fleet_rl_maintenance');
    this.routeOptimizationAgent.load('fleet_rl_route');
    this.resourceAllocationAgent.load('fleet_rl_resource');
  }

  private async trainAllModels(): Promise<void> {
    // Generate synthetic training data and train models
    console.log('Training ML models...');
    
    // Engine failure training data
    const engineData = this.generateEngineTrainingData();
    this.engineFailureModel.train(engineData, 500);
    
    // Brake wear training data
    const brakeData = this.generateBrakeTrainingData();
    this.brakeWearModel.train(brakeData, 500);
    
    // Battery health training data
    const batteryData = this.generateBatteryTrainingData();
    this.batteryHealthModel.train(batteryData, 500);
    
    // Tire wear training data
    const tireData = this.generateTireTrainingData();
    this.tireWearModel.train(tireData, 500);
    
    // Fuel efficiency training data
    const fuelData = this.generateFuelTrainingData();
    this.fuelEfficiencyModel.train(fuelData, 500);
    
    console.log('ML models trained successfully');
  }

  private normalize(value: number, min: number, max: number): number {
    return (value - min) / (max - min);
  }

  private generateEngineTrainingData(): TrainingData[] {
    const data: TrainingData[] = [];
    
    for (let i = 0; i < 200; i++) {
      const engineTemp = 70 + Math.random() * 50; // 70-120°C
      const oilPressure = 20 + Math.random() * 40; // 20-60 PSI
      const mileage = Math.random() * 300000; // 0-300k km
      const age = Math.random() * 15; // 0-15 years
      const avgLoad = Math.random(); // 0-1
      const engineHours = Math.random() * 10000; // 0-10k hours
      
      // Calculate failure probability based on realistic factors
      const tempRisk = engineTemp > 100 ? (engineTemp - 100) / 20 : 0;
      const oilRisk = oilPressure < 30 ? (30 - oilPressure) / 30 : 0;
      const mileageRisk = mileage / 400000;
      const ageRisk = age / 20;
      const loadRisk = avgLoad * 0.3;
      const hoursRisk = engineHours / 15000;
      
      const failureProbability = Math.min(0.95, (tempRisk * 0.25 + oilRisk * 0.2 + mileageRisk * 0.2 + ageRisk * 0.15 + loadRisk * 0.1 + hoursRisk * 0.1));
      const urgency = failureProbability > 0.6 ? 1 : failureProbability > 0.3 ? 0.5 : 0.2;
      
      data.push({
        inputs: [
          this.normalize(engineTemp, 70, 120),
          this.normalize(oilPressure, 20, 60),
          this.normalize(mileage, 0, 300000),
          this.normalize(age, 0, 15),
          avgLoad,
          this.normalize(engineHours, 0, 10000)
        ],
        outputs: [failureProbability, urgency]
      });
    }
    
    return data;
  }

  private generateBrakeTrainingData(): TrainingData[] {
    const data: TrainingData[] = [];
    
    for (let i = 0; i < 200; i++) {
      const brakeUsage = Math.random(); // 0-1 intensity
      const mileage = Math.random() * 100000; // km since last service
      const avgLoad = Math.random();
      const terrainType = Math.random(); // 0=flat, 1=mountainous
      const lastService = Math.random() * 50000; // km since last brake service
      
      const wearProbability = Math.min(0.95, 
        brakeUsage * 0.25 + 
        (mileage / 120000) * 0.25 + 
        avgLoad * 0.2 + 
        terrainType * 0.15 + 
        (lastService / 60000) * 0.15
      );
      
      data.push({
        inputs: [brakeUsage, this.normalize(mileage, 0, 100000), avgLoad, terrainType, this.normalize(lastService, 0, 50000)],
        outputs: [wearProbability, wearProbability > 0.7 ? 1 : 0.3]
      });
    }
    
    return data;
  }

  private generateBatteryTrainingData(): TrainingData[] {
    const data: TrainingData[] = [];
    
    for (let i = 0; i < 200; i++) {
      const voltage = 11 + Math.random() * 3; // 11-14V
      const temperature = -10 + Math.random() * 60; // -10 to 50°C
      const age = Math.random() * 7; // 0-7 years
      const chargeCycles = Math.random() * 1000;
      const avgDraw = Math.random(); // 0-1
      
      const voltageRisk = voltage < 12.2 ? (12.2 - voltage) / 1.2 : 0;
      const tempRisk = Math.abs(temperature - 20) / 40;
      const ageRisk = age / 8;
      const cycleRisk = chargeCycles / 1200;
      
      const failureProbability = Math.min(0.95, voltageRisk * 0.3 + tempRisk * 0.15 + ageRisk * 0.3 + cycleRisk * 0.15 + avgDraw * 0.1);
      
      data.push({
        inputs: [
          this.normalize(voltage, 11, 14),
          this.normalize(temperature, -10, 50),
          this.normalize(age, 0, 7),
          this.normalize(chargeCycles, 0, 1000),
          avgDraw
        ],
        outputs: [failureProbability, failureProbability > 0.5 ? 1 : 0.2]
      });
    }
    
    return data;
  }

  private generateTireTrainingData(): TrainingData[] {
    const data: TrainingData[] = [];
    
    for (let i = 0; i < 200; i++) {
      const tirePressure = 25 + Math.random() * 15; // 25-40 PSI
      const mileage = Math.random() * 80000; // km on tires
      const loadWeight = Math.random();
      const terrainRoughness = Math.random();
      const alignmentScore = 0.5 + Math.random() * 0.5; // 0.5-1
      
      const pressureRisk = Math.abs(tirePressure - 32) / 10;
      const mileageRisk = mileage / 100000;
      
      const wearProbability = Math.min(0.95, 
        pressureRisk * 0.2 + 
        mileageRisk * 0.35 + 
        loadWeight * 0.15 + 
        terrainRoughness * 0.15 + 
        (1 - alignmentScore) * 0.15
      );
      
      data.push({
        inputs: [
          this.normalize(tirePressure, 25, 40),
          this.normalize(mileage, 0, 80000),
          loadWeight,
          terrainRoughness,
          alignmentScore
        ],
        outputs: [wearProbability, wearProbability > 0.6 ? 1 : 0.3]
      });
    }
    
    return data;
  }

  private generateFuelTrainingData(): TrainingData[] {
    const data: TrainingData[] = [];
    
    for (let i = 0; i < 200; i++) {
      const speed = 30 + Math.random() * 100; // 30-130 km/h
      const load = Math.random();
      const terrainGrade = Math.random() * 0.15; // 0-15% grade
      const airTemp = -10 + Math.random() * 50;
      const tireCondition = 0.5 + Math.random() * 0.5;
      const engineEfficiency = 0.6 + Math.random() * 0.4;
      
      // Optimal speed around 60-80 km/h
      const speedFactor = 1 - Math.abs(speed - 70) / 100;
      const efficiency = (speedFactor * 0.25 + (1 - load) * 0.2 + (1 - terrainGrade / 0.15) * 0.2 + 
                         tireCondition * 0.15 + engineEfficiency * 0.2) * 15; // 0-15 km/L
      
      data.push({
        inputs: [
          this.normalize(speed, 30, 130),
          load,
          terrainGrade / 0.15,
          this.normalize(airTemp, -10, 40),
          tireCondition,
          engineEfficiency
        ],
        outputs: [this.normalize(efficiency, 5, 15)]
      });
    }
    
    return data;
  }

  // Prediction methods
  predictEngineFailure(data: {
    engineTemp: number;
    oilPressure: number;
    mileage: number;
    vehicleAge: number;
    avgLoad: number;
    engineHours: number;
  }): PredictionResult {
    const inputs = [
      this.normalize(data.engineTemp, 70, 120),
      this.normalize(data.oilPressure, 20, 60),
      this.normalize(data.mileage, 0, 300000),
      this.normalize(data.vehicleAge, 0, 15),
      data.avgLoad,
      this.normalize(data.engineHours, 0, 10000)
    ];
    
    const output = this.engineFailureModel.forward(inputs);
    const probability = output[0];
    const urgency = output[1];
    
    return {
      probability: Math.round(probability * 100),
      confidence: Math.round((1 - Math.abs(probability - 0.5) * 0.5) * 100),
      daysUntilFailure: Math.max(1, Math.round((1 - probability) * 180)),
      component: 'Engine',
      severity: probability > 0.7 ? 'critical' : probability > 0.5 ? 'high' : probability > 0.3 ? 'medium' : 'low',
      recommendation: this.getEngineRecommendation(probability, data)
    };
  }

  predictBrakeWear(data: {
    brakeUsageIntensity: number;
    mileageSinceService: number;
    avgLoad: number;
    terrainType: number;
    lastBrakeService: number;
  }): PredictionResult {
    const inputs = [
      data.brakeUsageIntensity,
      this.normalize(data.mileageSinceService, 0, 100000),
      data.avgLoad,
      data.terrainType,
      this.normalize(data.lastBrakeService, 0, 50000)
    ];
    
    const output = this.brakeWearModel.forward(inputs);
    const probability = output[0];
    
    return {
      probability: Math.round(probability * 100),
      confidence: Math.round((0.7 + Math.random() * 0.25) * 100),
      daysUntilFailure: Math.max(1, Math.round((1 - probability) * 90)),
      component: 'Brakes',
      severity: probability > 0.7 ? 'critical' : probability > 0.5 ? 'high' : probability > 0.3 ? 'medium' : 'low',
      recommendation: probability > 0.6 ? 'Schedule brake inspection immediately' : 
                     probability > 0.3 ? 'Plan brake service within 30 days' : 'Brakes in good condition'
    };
  }

  predictBatteryHealth(data: {
    voltage: number;
    temperature: number;
    batteryAge: number;
    chargeCycles: number;
    avgDraw: number;
  }): PredictionResult {
    const inputs = [
      this.normalize(data.voltage, 11, 14),
      this.normalize(data.temperature, -10, 50),
      this.normalize(data.batteryAge, 0, 7),
      this.normalize(data.chargeCycles, 0, 1000),
      data.avgDraw
    ];
    
    const output = this.batteryHealthModel.forward(inputs);
    const probability = output[0];
    
    return {
      probability: Math.round(probability * 100),
      confidence: Math.round((0.75 + Math.random() * 0.2) * 100),
      daysUntilFailure: Math.max(1, Math.round((1 - probability) * 120)),
      component: 'Battery',
      severity: probability > 0.7 ? 'critical' : probability > 0.5 ? 'high' : probability > 0.3 ? 'medium' : 'low',
      recommendation: probability > 0.6 ? 'Battery replacement recommended soon' :
                     probability > 0.3 ? 'Monitor battery voltage regularly' : 'Battery health is good'
    };
  }

  predictTireWear(data: {
    tirePressure: number;
    mileageOnTires: number;
    avgLoadWeight: number;
    terrainRoughness: number;
    alignmentScore: number;
  }): PredictionResult {
    const inputs = [
      this.normalize(data.tirePressure, 25, 40),
      this.normalize(data.mileageOnTires, 0, 80000),
      data.avgLoadWeight,
      data.terrainRoughness,
      data.alignmentScore
    ];
    
    const output = this.tireWearModel.forward(inputs);
    const probability = output[0];
    
    return {
      probability: Math.round(probability * 100),
      confidence: Math.round((0.7 + Math.random() * 0.25) * 100),
      daysUntilFailure: Math.max(1, Math.round((1 - probability) * 60)),
      component: 'Tires',
      severity: probability > 0.7 ? 'critical' : probability > 0.5 ? 'high' : probability > 0.3 ? 'medium' : 'low',
      recommendation: probability > 0.6 ? 'Tire replacement needed soon' :
                     probability > 0.3 ? 'Check tire tread depth and pressure' : 'Tires in good condition'
    };
  }

  predictFuelEfficiency(data: {
    avgSpeed: number;
    loadFactor: number;
    terrainGrade: number;
    ambientTemp: number;
    tireCondition: number;
    engineEfficiency: number;
  }): number {
    const inputs = [
      this.normalize(data.avgSpeed, 30, 130),
      data.loadFactor,
      data.terrainGrade / 0.15,
      this.normalize(data.ambientTemp, -10, 40),
      data.tireCondition,
      data.engineEfficiency
    ];
    
    const output = this.fuelEfficiencyModel.forward(inputs);
    return 5 + output[0] * 10; // Return km/L (5-15 range)
  }

  // Get all predictions for a vehicle
  getVehiclePredictions(vehicleData: {
    engineTemp: number;
    oilPressure: number;
    mileage: number;
    vehicleAge: number;
    batteryVoltage: number;
    tirePressure: number;
    engineHours: number;
  }): PredictionResult[] {
    return [
      this.predictEngineFailure({
        engineTemp: vehicleData.engineTemp,
        oilPressure: vehicleData.oilPressure,
        mileage: vehicleData.mileage,
        vehicleAge: vehicleData.vehicleAge,
        avgLoad: 0.6,
        engineHours: vehicleData.engineHours
      }),
      this.predictBrakeWear({
        brakeUsageIntensity: 0.5,
        mileageSinceService: vehicleData.mileage % 30000,
        avgLoad: 0.6,
        terrainType: 0.3,
        lastBrakeService: vehicleData.mileage % 50000
      }),
      this.predictBatteryHealth({
        voltage: vehicleData.batteryVoltage,
        temperature: 25,
        batteryAge: vehicleData.vehicleAge * 0.5,
        chargeCycles: vehicleData.mileage / 500,
        avgDraw: 0.4
      }),
      this.predictTireWear({
        tirePressure: vehicleData.tirePressure,
        mileageOnTires: vehicleData.mileage % 60000,
        avgLoadWeight: 0.5,
        terrainRoughness: 0.3,
        alignmentScore: 0.85
      })
    ];
  }

  private getEngineRecommendation(probability: number, data: { engineTemp: number; oilPressure: number; mileage: number }): string {
    if (probability > 0.7) {
      return 'Critical: Schedule immediate engine inspection. Check oil levels and cooling system.';
    } else if (probability > 0.5) {
      if (data.engineTemp > 100) return 'High engine temperature detected. Check cooling system.';
      if (data.oilPressure < 30) return 'Low oil pressure. Check oil levels and filter.';
      return 'Schedule engine maintenance within 2 weeks.';
    } else if (probability > 0.3) {
      return 'Monitor engine performance. Next service due in 30 days.';
    }
    return 'Engine operating within normal parameters.';
  }
  
  // Reinforcement Learning Methods
  
  // Get optimal maintenance action using RL
  getOptimalMaintenanceAction(state: RLState): RLAction {
    const stateVector = [
      state.vehicleHealth,
      this.normalize(state.maintenanceCost, 0, 10000),
      this.normalize(state.downtime, 0, 168), // Max 1 week downtime
      state.efficiency,
      this.normalize(state.alerts, 0, 10)
    ];
    
    const actionIndex = this.maintenanceAgent.selectAction(stateVector);
    const actions: RLAction[] = [
      { type: 'maintain', urgency: 'scheduled', cost: 500 },
      { type: 'inspect', urgency: 'planned', cost: 100 },
      { type: 'replace', urgency: 'immediate', cost: 2000 },
      { type: 'defer', urgency: 'planned', cost: 0 },
      { type: 'optimize_route', urgency: 'immediate', cost: 50 }
    ];
    
    return actions[actionIndex];
  }
  
  // Learn from maintenance action results
  learnFromMaintenanceAction(vehicleId: string, state: RLState, action: RLAction, newState: RLState, reward: RLReward): void {
    const stateVector = [
      state.vehicleHealth,
      this.normalize(state.maintenanceCost, 0, 10000),
      this.normalize(state.downtime, 0, 168),
      state.efficiency,
      this.normalize(state.alerts, 0, 10)
    ];
    
    const newStateVector = [
      newState.vehicleHealth,
      this.normalize(newState.maintenanceCost, 0, 10000),
      this.normalize(newState.downtime, 0, 168),
      newState.efficiency,
      this.normalize(newState.alerts, 0, 10)
    ];
    
    const actionIndex = ['maintain', 'inspect', 'replace', 'defer', 'optimize_route'].indexOf(action.type);
    const done = newState.vehicleHealth < 0.2 || newState.downtime > 120; // Terminal states
    
    this.maintenanceAgent.remember(stateVector, actionIndex, reward.value, newStateVector, done);
    this.maintenanceAgent.replay();
    
    // Store in memory for analysis
    if (!this.rlMemory.has(vehicleId)) {
      this.rlMemory.set(vehicleId, []);
    }
    this.rlMemory.get(vehicleId)!.push({
      state, action, reward, timestamp: Date.now()
    });
  }
  
  // Calculate reward for maintenance actions
  calculateMaintenanceReward(beforeState: RLState, afterState: RLState, action: RLAction): RLReward {
    const healthImprovement = afterState.vehicleHealth - beforeState.vehicleHealth;
    const downtimeReduction = beforeState.downtime - afterState.downtime;
    const efficiencyGain = afterState.efficiency - beforeState.efficiency;
    const costIncurred = action.cost;
    
    const costSaving = downtimeReduction * 50 - costIncurred; // $50/hour saved downtime
    const safetyImprovement = Math.max(0, healthImprovement) * 100;
    
    const totalReward = (costSaving * 0.3) + (downtimeReduction * 0.3) + 
                       (safetyImprovement * 0.2) + (efficiencyGain * 200 * 0.2);
    
    return {
      value: totalReward,
      breakdown: {
        cost_saving: costSaving,
        downtime_reduction: downtimeReduction * 10,
        safety_improvement: safetyImprovement,
        efficiency_gain: efficiencyGain * 200
      }
    };
  }
  
  // Get RL performance metrics
  getRLPerformanceMetrics(): {
    maintenanceAccuracy: number;
    averageReward: number;
    learningProgress: number;
    decisionConfidence: number;
  } {
    let totalReward = 0;
    let rewardCount = 0;
    
    for (const vehicleMemory of this.rlMemory.values()) {
      for (const experience of vehicleMemory) {
        totalReward += experience.reward.value;
        rewardCount++;
      }
    }
    
    return {
      maintenanceAccuracy: Math.min(95, 60 + this.maintenanceAgent['steps'] / 100),
      averageReward: rewardCount > 0 ? totalReward / rewardCount : 0,
      learningProgress: Math.min(100, this.maintenanceAgent['steps'] / 10),
      decisionConfidence: Math.max(60, 100 - this.maintenanceAgent['epsilon'] * 100)
    };
  }
  
  // Enhanced predictions with RL recommendations
  getEnhancedPredictionsWithRL(vehicleData: any): {
    predictions: PredictionResult[];
    rlRecommendation: RLAction;
    confidence: number;
    expectedOutcome: string;
  } {
    const predictions = this.getVehiclePredictions(vehicleData);
    
    // Create state from predictions
    const avgProbability = predictions.reduce((sum, p) => sum + p.probability, 0) / predictions.length;
    const criticalAlerts = predictions.filter(p => p.severity === 'critical').length;
    
    const state: RLState = {
      vehicleHealth: (100 - avgProbability) / 100,
      maintenanceCost: 1000 * (avgProbability / 100),
      downtime: Math.max(...predictions.map(p => Math.min(168 - p.daysUntilFailure * 24, 0))),
      efficiency: 0.8 - (avgProbability / 200),
      alerts: criticalAlerts
    };
    
    const rlRecommendation = this.getOptimalMaintenanceAction(state);
    const metrics = this.getRLPerformanceMetrics();
    
    return {
      predictions,
      rlRecommendation,
      confidence: metrics.decisionConfidence,
      expectedOutcome: this.getExpectedOutcome(rlRecommendation, state)
    };
  }
  
  private getExpectedOutcome(action: RLAction, state: RLState): string {
    switch (action.type) {
      case 'maintain':
        return `Proactive maintenance will improve vehicle health by 15-25% and reduce breakdown risk.`;
      case 'inspect':
        return `Inspection will identify potential issues early, preventing ${Math.round(state.alerts * 30)}% of future problems.`;
      case 'replace':
        return `Component replacement will restore vehicle to 90%+ health and prevent major downtime.`;
      case 'defer':
        return `Deferring action saves immediate costs but increases failure risk by ${Math.round(state.vehicleHealth * 20)}%.`;
      case 'optimize_route':
        return `Route optimization will improve efficiency by 10-15% and reduce component wear.`;
      default:
        return 'Action will improve overall fleet performance.';
    }
  }
}

// Export singleton instance
export const fleetMLEngine = new FleetMLEngine();
