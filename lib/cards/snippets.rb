class Array
  # `to` is the last yielded index
  def upto to, &block
    0.upto(to) { |i| yield i, self[i] }
  end
  
  # Returns true if values are a sequence with an interval of diff
  def sequence? diff = 1
    tmp = self.sort
    
    tmp.upto(tmp.size-2) do |i, val|
      return false unless val + diff == tmp[i+1]
    end
    
    true
  end
  
  def shuffle
    self.sort_by {rand}
#    tmp = self.clone
#    shuffled = []
#
#    while tmp.size != 0
#      shuffled << tmp.delete_at(rand(tmp.size-1))
#    end
#
#    shuffled
  end
  
  def shuffle!
    tmp = shuffle
    self.clear
    self << tmp
    self.flatten!
  end
end
