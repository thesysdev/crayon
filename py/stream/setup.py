from setuptools import setup, find_packages

setup(
    name="crayonai_stream",
    version="0.6.1",
    description="Streaming utilities for CrayonAI",
    author="CrayonAI",
    packages=find_packages(where="src"),
    package_dir={"": "src"},
    python_requires=">=3.9",
    install_requires=[
        "pydantic>=2.0.0",
        "typing-extensions>=4.0.0",
    ],
)
