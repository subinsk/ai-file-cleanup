"""
Image classification using CNN models
"""

import torch
import torchvision.transforms as transforms
from PIL import Image
import os
from typing import Dict, List
import asyncio
from pathlib import Path


class ImageClassifier:
    """Image classification service using CNN models"""
    
    def __init__(self):
        self.model = None
        self.transform = None
        self.categories = ["photo", "screenshot", "diagram", "chart", "logo", "unknown"]
        self._load_model()
    
    def _load_model(self):
        """Load the CNN model and preprocessing transforms"""
        try:
            # Use a pre-trained ResNet model
            self.model = torch.hub.load('pytorch/vision', 'resnet18', pretrained=True)
            self.model.eval()
            
            # Define image preprocessing
            self.transform = transforms.Compose([
                transforms.Resize(256),
                transforms.CenterCrop(224),
                transforms.ToTensor(),
                transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
            ])
            
            print("✅ Loaded ResNet18 for image classification")
            
        except Exception as e:
            print(f"❌ Error loading image classifier: {e}")
            self.model = None
            self.transform = None
    
    async def classify(self, file_path: str) -> str:
        """Classify an image file"""
        try:
            if not self.model or not self.transform:
                return "unknown"
            
            # Load and preprocess image
            image = await self._load_image(file_path)
            if image is None:
                return "unknown"
            
            # Classify image
            category = await self._classify_image(image)
            return category
            
        except Exception as e:
            print(f"Error classifying image file {file_path}: {e}")
            return "unknown"
    
    async def _load_image(self, file_path: str) -> Image.Image:
        """Load image from file path"""
        try:
            # Check if file exists and is readable
            if not os.path.exists(file_path):
                return None
            
            # Check file size (limit to 10MB for image processing)
            file_size = os.path.getsize(file_path)
            if file_size > 10 * 1024 * 1024:  # 10MB limit
                return None
            
            # Load image
            image = Image.open(file_path)
            
            # Convert to RGB if necessary
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            return image
            
        except Exception as e:
            print(f"Error loading image {file_path}: {e}")
            return None
    
    async def _classify_image(self, image: Image.Image) -> str:
        """Classify image using CNN"""
        try:
            # Preprocess image
            input_tensor = self.transform(image).unsqueeze(0)
            
            # Get model prediction
            with torch.no_grad():
                outputs = self.model(input_tensor)
                # Get the predicted class
                _, predicted = torch.max(outputs, 1)
                predicted_class = predicted.item()
            
            # Map ImageNet classes to our categories
            category = self._map_imagenet_to_category(predicted_class)
            return category
            
        except Exception as e:
            print(f"Error classifying image: {e}")
            return "unknown"
    
    def _map_imagenet_to_category(self, imagenet_class: int) -> str:
        """Map ImageNet class to our custom categories"""
        try:
            # This is a simplified mapping - in production, you'd use a more sophisticated approach
            # or fine-tune the model on your specific categories
            
            # Photo-like classes (people, animals, objects)
            photo_classes = list(range(0, 200))  # General objects
            photo_classes.extend(list(range(200, 300)))  # Animals
            photo_classes.extend(list(range(300, 400)))  # Vehicles
            
            # Screenshot-like classes (computer-related)
            screenshot_classes = list(range(400, 500))  # Computer equipment
            
            # Diagram-like classes (geometric shapes, tools)
            diagram_classes = list(range(500, 600))  # Tools, instruments
            
            if imagenet_class in photo_classes:
                return "photo"
            elif imagenet_class in screenshot_classes:
                return "screenshot"
            elif imagenet_class in diagram_classes:
                return "diagram"
            else:
                return "unknown"
                
        except Exception as e:
            print(f"Error mapping ImageNet class: {e}")
            return "unknown"
    
    async def get_image_features(self, file_path: str) -> List[float]:
        """Extract image features for similarity comparison"""
        try:
            if not self.model or not self.transform:
                return []
            
            # Load image
            image = await self._load_image(file_path)
            if image is None:
                return []
            
            # Preprocess image
            input_tensor = self.transform(image).unsqueeze(0)
            
            # Extract features from the last layer before classification
            with torch.no_grad():
                features = self.model.avgpool(self.model.layer4(self.model.layer3(self.model.layer2(self.model.layer1(self.model.relu(self.model.bn1(self.model.conv1(input_tensor))))))))
                features = features.squeeze().numpy().tolist()
            
            return features
            
        except Exception as e:
            print(f"Error extracting image features: {e}")
            return []
