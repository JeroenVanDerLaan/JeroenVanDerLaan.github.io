```php
<?php declare(strict_types = 1);

namespace HighlySkilledProfessionals;

class FullStackDeveloper implements Developer
{    
    private int $powerLevel;
    
    public function __construct(int $powerLevel)
    {
        if ($powerLevel < 9000) {
            throw new LogicException('Who do you think I am? Yamcha?');
        }
        $this->powerLevel = $powerLevel;
    }
}
```